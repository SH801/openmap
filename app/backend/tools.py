"""
Copyright (c) Positive Farms, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/tools.py
Provides range of backend tools that can be run from command line:

importlocations: Imports location data from file that is used to geolocate specific locations
generategeometries: Generates multiple geometries of boundaries for multiple zoom levels using simplification
processspecialcases: Perform additional ad-hoc processing
importdata: Imports data for specific area scale and year range (assuming BEIS data)
"""

from os import walk
import math
import os
import numpy as np
import pandas
import json
import topojson as tp
import geojson
import csv
import re
import trafilatura
import requests
import time
import pandas as pd
import fiona
from copy import copy
from pyproj import Transformer, Geod
from googlesearch import search
from shapely.geometry import shape, GeometryCollection
from shapely.geometry import Polygon, MultiPolygon
from area import area as calculatearea
from w3lib.html import replace_entities
# from geojson import MultiPolygon

if __name__ == '__main__':
    import sys
    import django
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
    sys.path.append(parent_dir)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carbonmap.settings")
    django.setup()

from django.db.models import Value as V, F, CharField
from django.contrib.gis.db.models.functions import AsGeoJSON
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.gis.geos import GEOSException, Polygon, GEOSGeometry, Point, fromstr
from django.contrib.gis.db.models.functions import Distance
from django.db import connection, transaction
from django.contrib.gis.db.models import Extent
from backend.gis import get_degrees_per_pixel, get_postcode_point

from backend.models import \
    Entity, \
    EditTypes, \
    Location, \
    Geometry, \
    Context, \
    Property, \
    PropertyTypes, \
    GeometryCode, \
    Postcode, \
    EntitySourceType, \
    Funding, \
    FundingPeriodTypes, \
    FundingTypeTypes, \
    FundingSubtypeTypes

from backend.views import creategeometriesforentity, calculateCentreBBox

# Number of zoom levels to cache geometries for
# We generate a target-resolution-dependent simplification for each geometry object to minimize download size
zoomrange = 15

AREA_ACRESCUTOFF = 15

TURBINE_PADDING = 395 # Length of diagonal padding for 280m high wind turbine

POSTCODES_GEOPACKAGE = '../../codepo_gpkg_gb/Data/codepo_gb.gpkg'

# Paths to subregion geojson files

contexts = {
    'county': ['contexts/Boundary-line-ceremonial-counties_region.json'],
}

subregions = {
    'inspire': ['subregions/*']
}

subregions = {
    'inspire': ['/Volumes/A027/GIS/geojson/*']
}

entities = [
    'entities/*'
]

properties = [
    'properties/*'
]

funding = [
    'funding/*'
]

data = [
    'data/*'
]

renewables = [
    'renewables/*'
]

groups = [
    'groups/*'
]

osm = [
    'osm/renewables.geojson'
]

osm_output = 'osm/renewables_output.geojson'
windspeed_geojson = '/Volumes/A027/planningconstraints/planningconstraints/Wind/windspeed_m_per_second_100m.geojson'
grid_geojson = '/Volumes/A027/planningconstraints/grid.geojson'
grid_geojson_output = '/Volumes/A027/planningconstraints/grid_output.geojson'
grid_geojson_lines_output = '/Volumes/A027/planningconstraints/grid_output_lines.geojson'
grid_geojson_lines_1_output = '/Volumes/A027/planningconstraints/grid_output_lines_1.geojson'
grid_geojson_lines_2_output = '/Volumes/A027/planningconstraints/grid_output_lines_2.geojson'
grid_geojson_lines_3_output = '/Volumes/A027/planningconstraints/grid_output_lines_3.geojson'
grid_geojson_lines_4_output = '/Volumes/A027/planningconstraints/grid_output_lines_4.geojson'
grid_geojson_poles_output = '/Volumes/A027/planningconstraints/grid_output_poles.geojson'

subregion_scotland_correction = "subregions/Counties_and_Unitary_Authorities_GB_2018.json"

non_decimal = re.compile(r'[^\d.]+')

def HTMLEntitiesToUnicode(text):
    """Converts HTML entities to unicode.  For example '&amp;' becomes '&'."""
    return replace_entities(text)

def getlargestpolygon(areatype):
    """
    Get largest area for particular area type

    Ad-hoc function used to determine minimum zoom levels when MSOA/IG and LSOA/DZ appear
    """
    maxvalue = 0
    areacode = ''
    geometries = Geometry.objects.filter(zoom=15, type=areatype).annotate(Extent('geometry')).values('code', 'geometry__extent')
    for geometry in geometries:
        lng_west, lat_south, lng_east, lat_north = geometry['geometry__extent']
        lat_dif = lat_north - lat_south
        lng_dif = lng_east - lng_west

        if (lng_dif > maxvalue):
            maxvalue = lng_dif
            areacode = geometry['code']
        if (lat_dif > maxvalue):
            maxvalue = lat_dif
            areacode = geometry['code']

    return areacode

def get_yearsuffix_from_filepath(filepath):
    """
    Get year suffix from file path of boundary file
    """
    re_match = re.search(r"(\d{4})", filepath)
    if re_match:
        year = re_match.group(1)
        return year[2:]    
    else: return None

def get_feature_name_code(properties, yearsuffix = ""):
    """
    Get name and code from GeoJSON feature
    """    
    
    code = None
    if 'code' in properties: code = properties['code']
    elif ('lau1' + yearsuffix + 'cd') in properties: code = properties['lau1' + yearsuffix + 'cd']
    elif ('ctyua' + yearsuffix + 'cd') in properties: code = properties['ctyua' + yearsuffix + 'cd']

    name = None
    if 'Name' in properties: name = properties['Name']
    elif 'name' in properties: name = properties['name']
    elif 'NAME_2' in properties: 
        name = properties['NAME_2']
        code = 'UK_' + str(properties['ID_2'])
    elif 'NAME' in properties:
        name = properties['NAME']
        code = name.replace(' ', '').lower()

    elif ('lau1' + yearsuffix + 'nm') in properties: name = properties['lau1' + yearsuffix + 'nm']
    elif ('ctyua' + yearsuffix + 'nm') in properties: name = properties['ctyua' + yearsuffix + 'nm']

    if 'INSPIREID' in properties:
        code = "INSPIRE:" + str(properties['INSPIREID'])
        name = code

    return {'name': name, 'code': code}

def processspecialcases():
    """
    Perform additional ad-hoc processing

    - Replace Scotland LAU1s with separate local authority boundaries as BEIS data uses non-standard LAU1 naming
    """

    # Replace Scotland LAU1s with separate unitary authority boundaries as BEIS data uses unitary authorities for Scotland data at large scale
    scottishareas = Geometry.objects.filter(code__startswith="S", type='lau1').delete()
    print("Loading supplemental file for Scottish LAs", subregion_scotland_correction)
    with open(subregion_scotland_correction) as f:
        geojson_codes, topologysafe_codes = [], []
        yearsuffix = get_yearsuffix_from_filepath(subregion_scotland_correction)
        geometrydata = geojson.load(f)

        # Create a list of all feature codes for entire file
        for feature in geometrydata['features']:
            feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
            if feature_namecode['code']: geojson_codes.append(feature_namecode['code'])

        geometrytopology = tp.Topology(geometrydata)

        # Create a list of all feature codes that topojson processed successfully
        topologysafefeatures = json.loads(geometrytopology.to_geojson())
        for feature in topologysafefeatures['features']:
            feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
            if feature_namecode['code']: topologysafe_codes.append(feature_namecode['code'])

        # Get difference of feature codes between original file and topojson successfully processed feature codes
        code_diff = list(set(geojson_codes) - set(topologysafe_codes))

        # Create a custom feature set from the features that topojson failed to process
        # TODO: investigate why topojson fails on certain polygons
        diff_features = []
        for feature in geometrydata['features']:
            feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
            if feature_namecode['code'] in code_diff:
                diff_features.append(feature)

        print("Number of polygons topojson failed on =", len(diff_features))

        for zoom in range(0, zoomrange + 1):

            print("Creating identical polygons for all zoom levels for polygons topojson was not able to process", len(diff_features))

            for feature in diff_features:
                feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                if feature_namecode['code'][:1] == 'S': # Is scottish feature
                    try:
                        geometry = GEOSGeometry(str(feature['geometry']))
                        print("Saving geometry for", feature_namecode['code'], "zoom level", zoom)
                        geometryobject = Geometry(name=feature_namecode['name'], type='lau1', code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                        geometryobject.save()
                    except:
                        print("Failed to create geometry object - probably too small for zoom level", code, "zoom level", zoom, "degree resolution", zoomepsilon)
       
            zoomepsilon = get_degrees_per_pixel(zoom)

            print("Simplifying", subregion_scotland_correction, "for zoom level", zoom, "equivalent to degree resolution", zoomepsilon)

            simplifiedfeatures = json.loads(geometrytopology.toposimplify(
                epsilon=zoomepsilon, 
                simplify_algorithm='dp', 
                prevent_oversimplify=True
            ).to_geojson())

            count = 0
            for feature in simplifiedfeatures['features']:
                feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                geometry = GEOSGeometry(str(feature['geometry']))
                if feature_namecode['code'][:1] == 'S': # Is scottish feature
                    print("Saving geometry for", feature_namecode['code'], feature_namecode['name'])
                    geometryobject = Geometry(name=feature_namecode['name'], type='lau1', code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                    geometryobject.save() 

def importcontexts():
    """
    Import geometries from JSON files listed in contexts
    """

    for contexttype in contexts:
        Context.objects.filter(type=contexttype).delete()
        for contextfile in contexts[contexttype]:
            print("Loading context file", contextfile)
            with open(contextfile) as f:
                geojson_codes = []
                geometrydata = geojson.load(f)

                if contexttype == 'country':
                    geometry = GEOSGeometry(str(geometrydata['features'][0]['geometry']))
                    print("Saving geometry for country (default)")
                    geometryobject = Context(name='Default', shortcode='default', type=contexttype, geometry=geometry)
                    geometryobject.save()                     
                else:
                    for feature in geometrydata['features']:
                        feature_namecode = get_feature_name_code(feature['properties'], '')
                        if 'TYPE_2' in feature['properties']:
                            if contexttype == 'county': 
                                if \
                                (feature['properties']['DESCRIPTIO'] != 'Ceremonial County') & \
                                (feature['properties']['TYPE_2'] != 'County') & \
                                (feature['properties']['TYPE_2'] != 'Administrative County') & \
                                (feature['properties']['TYPE_2'] != 'Unitary District') & \
                                (feature['properties']['TYPE_2'] != 'Unitary Authority (wales)') & \
                                (feature['properties']['TYPE_2'] != 'District') : continue
                            if contexttype == 'londonborough': 
                                if feature['properties']['TYPE_2'] != 'London Borough': continue
                            if contexttype == 'unitaryauthority': 
                                if feature['properties']['TYPE_2'] != 'Unitary Authority': continue

                        try:
                            geometry = GEOSGeometry(str(feature['geometry']))
                            print("Saving geometry for", feature_namecode['code'])
                            shortcode = feature_namecode['name'].replace(' ', '').lower()
                            geometryobject = Context(name=feature_namecode['name'], shortcode=shortcode, type=contexttype, code=feature_namecode['code'], geometry=geometry)
                            geometryobject.save() 
                        except:
                            print("Failed to create geometry object")

def assigntocontexts():
    """
    Assign entities to geometries based on containment
    """

    contexts = Context.objects.all()
    for context in contexts:
        # Don't run on 'Default' as it's typically a multipolygon and 
        # all entities should be automatically within it by definition
        if context.name == 'Default': continue
        print("Calculating containment for context:", context.name)
        contextgeometry = context.geometry
        geometries = Geometry.objects.filter(geometry__within = contextgeometry)
        for geometry in geometries:
            geometry.contexts.add(context)

def replacefilewildcardsList(filelist):
    """
    Replace file wildcards with equivalent files for list of files
    """

    output_filelist = []
    for singlefile in filelist:
        if singlefile[-1:] == "*":
            directory = singlefile[:-1]
            filenames = next(walk(directory), (None, None, []))[2]
            if '.DS_Store' in filenames: filenames.remove('.DS_Store')
            filenames = [directory + filename for filename in filenames]
            output_filelist += filenames
        else:
            output_filelist.append(singlefile)

    return output_filelist

def replacefilewildcards(filesobject):
    """
    Replace file wildcards with equivalent files
    """

    if type(filesobject) == list:
        return replacefilewildcardsList(filesobject)
    else:
        return {type: replacefilewildcardsList(filesobject[type]) for type in filesobject}

def generatesinglegeometries():
    """
    Generates geometries of boundaries for single zoom levels using simplification
    """

    zoom = 15

    newsubregions = replacefilewildcards(subregions)

    for areatype in newsubregions:
        Geometry.objects.filter(type=areatype).delete()
        for areafile in newsubregions[areatype]:
            print("Loading area file", areafile)
            with open(areafile) as f:
                filtered_codes, geojson_codes, topologysafe_codes = [], [], []
                geometrydata = geojson.load(f)

                # Create a list of all feature codes for entire file and
                # also determine which features to save based on area
                for feature in geometrydata['features']:
                    feature_namecode = get_feature_name_code(feature['properties'])
                    meters_sq = calculatearea(feature['geometry'])
                    acres = meters_sq * 0.000247105381 # meters^2 to acres
                    if acres >= AREA_ACRESCUTOFF: 
                        try:
                            geometry = GEOSGeometry(str(feature['geometry']))
                            print("Saving geometry for", feature_namecode['code'], "zoom level", zoom)
                            geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                            geometryobject.save() 
                        except:
                            print("Failed to create geometry object - probably too small for zoom level", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)

                # geometrytopology = tp.Topology(geometrydata)

                # # Create a list of all feature codes that topojson processed successfully
                # topologysafefeatures = json.loads(geometrytopology.to_geojson())
                # for feature in topologysafefeatures['features']:
                #     feature_namecode = get_feature_name_code(feature['properties'])
                #     topologysafe_codes.append(feature_namecode['code'])

                # # Get difference of feature codes between original file and topojson successfully processed feature codes
                # code_diff = list(set(geojson_codes) - set(topologysafe_codes))

                # # Create a custom feature set from the features that topojson failed to process
                # # TODO: investigate why topojson fails on certain polygons
                # diff_features = []
                # for feature in geometrydata['features']:
                #     feature_namecode = get_feature_name_code(feature['properties'])
                #     if feature_namecode['code'] in code_diff:
                #         diff_features.append(feature)

                # print("Number of polygons topojson failed on =", len(diff_features))

                # print("Creating identical polygons for single zoom level for polygons topojson was not able to process", len(diff_features))

                # for feature in diff_features:
                #     feature_namecode = get_feature_name_code(feature['properties'])
                #     if feature_namecode['code'] not in filtered_codes: continue

                #     try:
                #         geometry = GEOSGeometry(str(feature['geometry']))
                #         print("Saving geometry for", feature_namecode['code'], "zoom level", zoom)
                #         geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                #         geometryobject.save() 
                #     except:
                #         print("Failed to create geometry object - probably too small for zoom level", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)

                # zoomepsilon = get_degrees_per_pixel(zoom)

                # print("Simplifying", areafile, "for zoom level", zoom, "equivalent to degree resolution", zoomepsilon)

                # simplifiedfeatures = json.loads(geometrytopology.toposimplify(
                #     epsilon=zoomepsilon, 
                #     simplify_algorithm='dp', 
                #     prevent_oversimplify=True
                # ).to_geojson())

                # for feature in simplifiedfeatures['features']:
                #     feature_namecode = get_feature_name_code(feature['properties'])
                #     if feature_namecode['code'] not in filtered_codes: continue

                #     try:
                #         geometry = GEOSGeometry(str(feature['geometry']))
                #         print("Saving geometry for", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)
                #         geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                #         geometryobject.save() 
                #     except:
                #         print("Failed to create geometry object - probably too small for zoom level", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)

def generategeometries():
    """
    Generates multiple geometries of boundaries for multiple zoom levels using simplification
    """

    newsubregions = replacefilewildcards(subregions)

    for areatype in newsubregions:
        Geometry.objects.filter(type=areatype).delete()
        for areafile in newsubregions[areatype]:
            print("Loading area file", areafile)
            with open(areafile) as f:
                filtered_codes, geojson_codes, topologysafe_codes = [], [], []
                geometrydata = geojson.load(f)

                # Create a list of all feature codes for entire file and
                # also determine which features to save based on area
                for feature in geometrydata['features']:
                    feature_namecode = get_feature_name_code(feature['properties'])
                    geojson_codes.append(feature_namecode['code'])
                    meters_sq = calculatearea(feature['geometry'])
                    acres = meters_sq * 0.000247105381 # meters^2 to acres
                    if acres >= AREA_ACRESCUTOFF: filtered_codes.append(feature_namecode['code'])

                geometrytopology = tp.Topology(geometrydata)

                # Create a list of all feature codes that topojson processed successfully
                topologysafefeatures = json.loads(geometrytopology.to_geojson())
                for feature in topologysafefeatures['features']:
                    feature_namecode = get_feature_name_code(feature['properties'])
                    topologysafe_codes.append(feature_namecode['code'])

                # Get difference of feature codes between original file and topojson successfully processed feature codes
                code_diff = list(set(geojson_codes) - set(topologysafe_codes))

                # Create a custom feature set from the features that topojson failed to process
                # TODO: investigate why topojson fails on certain polygons
                diff_features = []
                for feature in geometrydata['features']:
                    feature_namecode = get_feature_name_code(feature['properties'])
                    if feature_namecode['code'] in code_diff:
                        diff_features.append(feature)

                print("Number of polygons topojson failed on =", len(diff_features))

                for zoom in range(0, zoomrange + 1):

                    print("Creating identical polygons for all zoom levels for polygons topojson was not able to process", len(diff_features))

                    for feature in diff_features:
                        feature_namecode = get_feature_name_code(feature['properties'])
                        if feature_namecode['code'] not in filtered_codes: continue

                        try:
                            geometry = GEOSGeometry(str(feature['geometry']))
                            print("Saving geometry for", feature_namecode['code'], "zoom level", zoom)
                            geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                            geometryobject.save() 
                        except:
                            print("Failed to create geometry object - probably too small for zoom level", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)

                    zoomepsilon = get_degrees_per_pixel(zoom)

                    print("Simplifying", areafile, "for zoom level", zoom, "equivalent to degree resolution", zoomepsilon)

                    simplifiedfeatures = json.loads(geometrytopology.toposimplify(
                        epsilon=zoomepsilon, 
                        simplify_algorithm='dp', 
                        prevent_oversimplify=True
                    ).to_geojson())

                    for feature in simplifiedfeatures['features']:
                        feature_namecode = get_feature_name_code(feature['properties'])
                        if feature_namecode['code'] not in filtered_codes: continue

                        try:
                            geometry = GEOSGeometry(str(feature['geometry']))
                            print("Saving geometry for", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)
                            geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                            geometryobject.save() 
                        except:
                            print("Failed to create geometry object - probably too small for zoom level", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)


def importdatabygeometrytype(geometrytype, year, datatype):
    """
    Import data for a specific geometry type and year
    """

    datatypecode = 'ELEC'
    if datatype == 1: datatypecode = 'GAS'
    geometry_prefix = 'LSOA'
    geometrycode_row = 'LSOACode'
    multiplier_meter = 1
    multiplier_value = 1
    if geometrytype == 'msoa': 
        geometry_prefix = 'MSOA'
        geometrycode_row = 'MSOACode'
    if geometrytype == 'lau1': 
        geometry_prefix = 'LAU1'
        geometrycode_row = 'LA Code'
        multiplier_meter = 1000
        multiplier_value = 1000000
    filepath = 'BEIS/' + geometry_prefix + '_' + datatypecode + '_' + str(year) + '.csv'
    Data.objects.filter(geometrytype=geometrytype, year=year, type=datatype).delete()

    count = 0
    if os.path.isfile(filepath):
        with open(filepath, 'r' ) as fileobj:
            reader = csv.DictReader(fileobj)
            for row in reader:
                count += 1
                print("Importing line", count, filepath)
                geometrycode = row[geometrycode_row].strip()
                if geometrytype == 'lau1':
                    if row['Total consumption'] == '..': continue
                    if row['Total consumption'] == ' -   ': continue
                    value = float(non_decimal.sub("", row['Total consumption']))
                    meters = float(row['Total number of meters'])
                else:            
                    value = float(row['KWH'])
                    meters = float(row['METERS'])
                meters = meters * multiplier_meter
                value = value * multiplier_value
                data = Data(
                    type=datatype,
                    year=str(year), 
                    value=value,
                    meters=meters,
                    geometrycode=geometrycode,
                    geometrytype=geometrytype)
                data.save()

        print("Imported " + geometry_prefix + " for type " + str(datatype) + " for " + str(year))
    else:
        print(filepath, "not found")

# From https://stackoverflow.com/questions/238260/how-to-calculate-the-bounding-box-for-a-given-lat-lng-location
# degrees to radians
def deg2rad(degrees):
    return math.pi*degrees/180.0
# radians to degrees
def rad2deg(radians):
    return 180.0*radians/math.pi

# Semi-axes of WGS-84 geoidal reference
WGS84_a = 6378137.0  # Major semiaxis [m]
WGS84_b = 6356752.3  # Minor semiaxis [m]

# Earth radius at a given latitude, according to the WGS-84 ellipsoid [m]
def WGS84EarthRadius(lat):
    # http://en.wikipedia.org/wiki/Earth_radius
    An = WGS84_a*WGS84_a * math.cos(lat)
    Bn = WGS84_b*WGS84_b * math.sin(lat)
    Ad = WGS84_a * math.cos(lat)
    Bd = WGS84_b * math.sin(lat)
    return math.sqrt( (An*An + Bn*Bn)/(Ad*Ad + Bd*Bd) )

# Bounding box surrounding the point at given coordinates,
# assuming local approximation of Earth surface as a sphere
# of radius given by WGS84
def boundingBox(latitudeInDegrees, longitudeInDegrees, halfSideInKm):
    lat = deg2rad(latitudeInDegrees)
    lon = deg2rad(longitudeInDegrees)
    halfSide = 1000*halfSideInKm

    # Radius of Earth at given latitude
    radius = WGS84EarthRadius(lat)
    # Radius of the parallel at given latitude
    pradius = radius*math.cos(lat)

    latMin = lat - halfSide/radius
    latMax = lat + halfSide/radius
    lonMin = lon - halfSide/pradius
    lonMax = lon + halfSide/pradius

    return (rad2deg(lonMin), rad2deg(latMin), rad2deg(lonMax), rad2deg(latMax))

def updateshortcodes():
    """
    Updates shortcodes (external_id) on all entities
    """

    entities = Entity.objects.all()
    for entity in entities:
        print("Updating shortcode for", entity.name)
        entity.save()

def resetshortcodes():
    """
    Resets shortcodes (external_id) on all entities
    """

    entities = Entity.objects.all()
    for entity in entities:
        print("Clearing shortcode for", entity.name)
        entity.external_id = ''
        entity.save()

def importentities():
    """
    Imports entity data from list of files
    """

    entityfiles = replacefilewildcards(entities)

    dummydata = """
[
  {
    "name": "Agricultural yields - 2023",
    "type": "bar",
    "units": "Tonnes",
    "values": {
      "2012": "15",
      "2013": "17",
      "2014": "19"
    }
  },
  {
    "name": "Proportion of land using no-till",
    "type": "pie",
    "units": "Acres",
    "values": {
      "2012": "15",
      "2013": "17",
      "2014": "19"
    }
  }
]
"""
    dummydata = json.loads(dummydata)

    for entityfile in entityfiles:
        if os.path.isfile(entityfile):
            with open(entityfile, 'r', encoding="utf-8-sig") as fileobj:
                reader = csv.DictReader(fileobj)
                fields = reader.fieldnames
                properties = list(Property.objects.filter(name__in=fields).values('pk', 'name'))
                count = 0
                for row in reader:
                    count += 1
                    row['Postcode'] = row['Postcode'].strip().upper()
                    row['Website'] = row['Website'].strip()
                    location = get_postcode_point(row['Postcode'])
                    nearestgeometrycode = None
                    if location is not None:
                        point = GEOSGeometry(location)
                        point.srid = 4326
                        boundingbox = Polygon.from_bbox(boundingBox(location[1], location[0], 2))
                        geometriesinbbox = Geometry.objects.filter(zoom=15, geometry__bboverlaps=boundingbox)
                        # print(point, boundingbox, "Number of geometries in bbox", len(geometriesinbbox))
                        nearestgeometrycode = geometriesinbbox.annotate(distance=Distance('geometry', point)).order_by('distance').values_list('code', flat=True).first()

                    # if row['Website'].strip() != "":
                    #     downloaded = trafilatura.fetch_url(row['Website'])
                    #     websitecontent = trafilatura.extract(downloaded)
                    #     if (row['Notes'] == '') & (websitecontent is not None):
                    #         row['Notes'] = websitecontent 

                    Entity.objects.filter(name=row['Name']).filter(address__icontains=row['Postcode']).delete()
                    entity = Entity(    status=EditTypes.EDIT_LIVE, \
                                        name=row['Name'], \
                                        address=row['Address'], \
                                        postcode=row['Postcode'], \
                                        location=location, \
                                        img=row['Img'], \
                                        website=row['Website'], \
                                        data=dummydata, \
                                        desc=row['Notes'])
                    entity.user = None
                    entity.save()
                    entityproperties = list(filter(lambda property: row[property['name']] == 'Y', properties))
                    print("Importing line", count, ":", row['Name'], location, "contained in", nearestgeometrycode)
                    entityproperties_pks = [property['pk'] for property in entityproperties]
                    entity.properties.set(entityproperties_pks)
                    if nearestgeometrycode is not None:
                        geometrycode = GeometryCode.objects.filter(code=nearestgeometrycode)
                        if geometrycode:
                            geometrycode_pk = geometrycode.first().pk
                        else:
                            geometrycode = GeometryCode(code=nearestgeometrycode)
                            geometrycode.save()
                            geometrycode_pk = geometrycode.pk
                        entity.geometrycodes.set([geometrycode_pk])

def updateentities():
    """
    Updates all live entities in case there are pre-save actions or 'Go live' specific action that need to be carried out    
    """

    entities = Entity.objects.all().filter(status=EditTypes.EDIT_LIVE)
    for entity in entities:
        print("Updating entity", entity.name)
        entity.save()
        calculateCentreBBox(entity.id)

def importproperties():
    """
    Imports properties from list of files
    """

    propertyfiles = replacefilewildcards(properties)

    for propertyfile in propertyfiles:
        if os.path.isfile(propertyfile):
            with open(propertyfile, 'r', encoding="utf-8-sig") as fileobj:
                reader = csv.DictReader(fileobj)
                count = 0
                for row in reader:
                    count += 1
                    print("Importing line", count, ":", row['Name'])
                    property = Property.objects\
                        .annotate(importedname=V(row['Name'], output_field=CharField()))\
                        .filter(importedname__istartswith=F('name')).first()
                    if property is None:
                        property = Property()                        
                    property.name=row['Name']
                    property.type=PropertyTypes.PROPERTY_ACTION
                    property.link=row['Wikipedia']
                    property.icon=row['Logo']
                    # if row['Colour'] != '':
                    #     property.icon += "_" + row['Colour']
                    property.save()

def importfunding():
    """
    Imports funding data from list of files
    """

    fundingfiles = replacefilewildcards(funding)

    for fundingfile in fundingfiles:
        if os.path.isfile(fundingfile):
            with open(fundingfile, 'r', encoding="utf-8-sig") as fileobj:
                reader = csv.DictReader(fileobj)
                count = 0
                for row in reader:
                    count += 1
                    print("Importing line", count, ":", row['Description'])
                    fundingobj = Funding.objects.filter(code=row['Code']).first()
                    if fundingobj is None:
                        fundingobj = Funding()   

                    if row['Period']    == 'Annual': fundingobj.period = FundingPeriodTypes.FUNDINGPERIOD_ANNUAL
                    if row['Period']    == 'Per visit': fundingobj.period = FundingPeriodTypes.FUNDINGPERIOD_PERVISIT
                    if row['Type']      == 'Main payment': fundingobj.type = FundingTypeTypes.FUNDINGTYPE_MAIN
                    if row['Type']      == 'Supplement payment': fundingobj.type = FundingTypeTypes.FUNDINGTYPE_SUPPLEMENT
                    if row['Subtype']   == 'SFI': fundingobj.subtype = FundingSubtypeTypes.FUNDINGSUBTYPE_SFI
                    if row['Subtype']   == 'CS': fundingobj.subtype = FundingSubtypeTypes.FUNDINGSUBTYPE_CS

                    fundingobj.area = row['Area']
                    fundingobj.code = row['Code']
                    fundingobj.description = row['Description']
                    fundingobj.peragreement = 0 if row['PerAgreement'] =='' else float(row['PerAgreement'])
                    fundingobj.peryear = 0 if row['PerYear'] =='' else float(row['PerYear'])
                    fundingobj.perplot = 0 if row['PerPlot'] =='' else float(row['PerPlot'])
                    fundingobj.perhectare = 0 if row['PerHectare'] =='' else float(row['PerHectare'])
                    fundingobj.permetre = 0 if row['PerMetre'] =='' else float(row['PerMetre'])
                    fundingobj.peritem = 0 if row['PerItem'] =='' else float(row['PerItem'])
                    fundingobj.extra = row['Extra']
                    fundingobj.save()

def importdata(geometrytype, yearstart, yearend):
    """
    Import data for specify geometry type and year range
    """

    for year in range(int(yearstart), 1 + int(yearend)):
        print ("Importing data for year", year)
        for datatype in DATATYPES_CHOICES:
            importdatabygeometrytype(geometrytype, year, datatype[0])

def checkgeometries():
    """
    Check to see if any geometries corrupted
    """

    allgeometries = Geometry.objects.all().annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'zoom', 'type', 'json').order_by('code', 'type', 'zoom')
    for geometry in allgeometries:
        print("Checking geometry", geometry['code'], geometry['type'], geometry['zoom'])
        json_data = json.dumps(list(geometry), cls=DjangoJSONEncoder)

def renameduplicateshortcodes():
    """
    Runs custom piece of SQL to rename duplicate shortcodes in location table
    """

    cursor = connection.cursor()
    cursor.execute("""
    UPDATE backend_location  
    SET shortcode = CONCAT(shortcode, REPLACE(LOWER(county), ' ', '')) 
    WHERE shortcode IN 
    (
        SELECT s.shortcode 
        FROM 
        (
            SELECT shortcode,COUNT(*) AS num 
            FROM backend_location GROUP BY shortcode
        ) AS s 
        WHERE s.num > 1
    );
    """, [])
    transaction.commit()

def computescale(population):
    """
    Computes appropriate scale to show locations with specific population
    """

    if population == '': population = 0
    population = int(population)

    if population < 20000: return 15
    if population < 40000: return 14.5
    if population < 60000: return 14
    if population < 80000: return 13.5
    if population < 100000: return 13
    if population < 200000: return 12.5
    if population < 400000: return 12
    if population < 600000: return 11.5
    if population < 800000: return 11
    if population < 1000000: return 10.5

    return 10

def importlocations():
    """
    Imports location data from file that is used to geolocate specific locations
    """

    with open('Towns_List_Extended.csv') as csvfile:
        reader = csv.DictReader(csvfile)
        count = 0
        Location.objects.all().delete()
        for row in reader:
            shortcode = row['Town'].lower()
            shortcode = re.sub("[ ]", "", shortcode)
            scale = computescale(row['Population'])
            p = Location(   shortcode=shortcode, 
                            town=row['Town'], 
                            county=row['County'], 
                            country=row['Country'], 
                            population=row['Population'], 
                            longitude=row['Longitude'], 
                            latitude=row['Latitude'], 
                            url=row['url'],
                            scale=scale)
            p.save()
            count += 1

    renameduplicateshortcodes()

    print("Import locations finished, imported: " + str(count))

def getURL(companyName, State):
    try:
        term = ' '.join([companyName, State])
        for url in search(term, num_results=1):
            return url
    except:
        return ''
    
def contextualizedata():
    """
    Adds contexts (ie. counties) to data based on value of 'lat' and 'lng' columns in spreadsheet
    """

    datafiles = replacefilewildcards(data)

    for datafile in datafiles:
        if os.path.isfile(datafile):
            directory = os.path.dirname(datafile)
            basename = os.path.basename(datafile)
            outputdirectory = os.path.join(directory, 'output')
            newdatafile = os.path.join(outputdirectory, basename[:-4] + "_contextualized.csv")
            with open(datafile, 'r', encoding="utf-8-sig") as readerfileobj:
                with open(newdatafile, "a",  encoding="utf-8-sig") as writerfileobj:
                    reader = csv.DictReader(readerfileobj)
                    fields = reader.fieldnames
                    fields = ["context"] + fields + ["website"]
                    writer = csv.DictWriter(writerfileobj, fieldnames=fields)
                    # writer.writeheader()
                    count = 0
                    previouspoint = False
                    for row in reader:
                        count += 1
                        if int(row['OBJECTID']) > 8311: previouspoint = True
                        if previouspoint is False: continue
                        lat, lng = row['lat'], row['lng']
                        print("Adding context and website to line", count, ":", lat, lng)
                        point = Point(float(lng), float(lat))
                        context = Context.objects.filter(geometry__intersects=point).first()
                        row['context'] = ''
                        county = ''
                        if context is not None:
                            row['context'] = context.name
                            county = context.name
                        row['website'] = getURL(row['org_name'], county)
                        writer.writerow(row)

def updatepostcodes():
    """
    Updates all postcodes using OS data
    """

    # Convert from National Grid (EPSG:27700 - OSGB36) to EPSG:4326 - WGS84
    transformer = Transformer.from_crs("EPSG:27700", "EPSG:4326")

    Postcode.objects.all().delete()

    # No need to pass "layer='etc'" if there's only one layer
    count = 0
    with fiona.open(POSTCODES_GEOPACKAGE) as layer:
        for feature in layer:
            count += 1
            postcode = feature['properties']['postcode'].replace(' ', '')
            location = transformer.transform(*feature['geometry'].coordinates)
            Postcode(code=postcode, location=Point(location[1], location[0])).save()    
            if count % 1000 == 0:
                print(count, postcode, location)

def get_bounding_box(geometry):
    coords = np.array(list(geojson.utils.coords(geometry)))
    return coords[:,0].min(), coords[:,1].min(), coords[:,0].max(), coords[:,1].max()

def get_bounding_box_list(geometrylist):
    coords = np.array(geometrylist)
    return coords[:,0].min(), coords[:,1].min(), coords[:,0].max(), coords[:,1].max()

def addcontext(properties, geometry):
    """
    Adds context property to properties
    """

    contexts = Context.objects.filter(geometry__intersects=GEOSGeometry(str(geometry))).values_list('pk')
    contextslist = ["'0'"]
    for context in contexts:
        contextslist.append("'" + str(context[0]) + "'")
    properties['contexts'] = ",".join(contextslist)
    return properties

def addrenewablesproperties(properties, renewables_ids):
    """
    Adds renewables-specific properties to properties
    """

    isSolar, isWind = False, False
    if 'generator:source' in properties:
        if properties["generator:source"] == "solar": isSolar = True
        if properties["generator:source"] == "wind": isWind = True
    if 'plant:source' in properties:
        if properties["plant:source"] == "solar": isSolar = True
        if properties["plant:source"] == "wind": isWind = True
    if 'name' not in properties:
        if isSolar: properties['name'] = 'Solar farm'
        if isWind: properties['name'] = 'Wind farm'
    else:
        if isSolar:
            if 'solar' not in properties['name'].lower():
                properties['name'] += " - Solar Farm"
        if isWind:
            if 'wind' not in properties['name'].lower():
                properties['name'] += " - Wind Farm"

    if isSolar:
        properties['renewabletype'] = 'solar' 
        properties['entityproperties'] = "'" + str(renewables_ids['solar']) + "'"
    if isWind: 
        properties['renewabletype'] = 'wind' 
        properties['entityproperties'] = "'" + str(renewables_ids['wind']) + "'"

    return properties

def extractviewableproperties(properties):

    useful_fields_osm = [
        "email",
        "number:of:elements",
        "operator",
        "owner",
        "manufacturer",
        "plant:output:electricity",
        "generator:output:electricity",
        "seamark:information",
        "seamark:name",
        "website",
        "description",
    ]

    viewableproperties = {}
    viewablepropertiesexist = False
    for fieldname in useful_fields_osm:
        if fieldname in properties:
            if ((fieldname != 'plant:output:electricity') and \
                (fieldname != 'generator:output:electricity')) \
                or (properties[fieldname] != 'yes'):
                viewableproperties[fieldname] = properties[fieldname]
                viewablepropertiesexist = True
    if viewablepropertiesexist: return json.dumps(viewableproperties, indent=2)
    return None

def addwindpadding(bounds):
    g = Geod(ellps='WGS84')
    bottom_left_corner = g.fwd(bounds[0], bounds[1], 225, (TURBINE_PADDING))
    top_right_corner = g.fwd(bounds[2], bounds[3], 45, (TURBINE_PADDING))
    top_right_corner = g.fwd(top_right_corner[0], top_right_corner[1], 0, (TURBINE_PADDING / 4.5))
    min_lon = bottom_left_corner[0]
    min_lat = bottom_left_corner[1]
    max_lon = top_right_corner[0]
    max_lat = top_right_corner[1]
    newbounds = (min_lon, min_lat, max_lon, max_lat)
    # print("Old bounds", bounds, "New bounds", newbounds)
    return newbounds

def processrenewables():
    """
    Process renewables data from BEIS and import solar farms from OSM
    """

    # Convert from National Grid (EPSG:27700 - OSGB36) to EPSG:4326 - WGS84
    transformer = Transformer.from_crs("EPSG:27700", "EPSG:4326")

    # Focus on mainstream, non-controversial renewables
    renewables_list = [
        # "Anaerobic Digestion", 
        # "Large Hydro", 
        # "Small Hydro", 
        # "Solar Photovoltaics", 
        # "Sewage Sludge Digestion", 
        # "Tidal Stream", 
        # "Tidal Lagoon", 
        # "Shoreline Wave", 
        "Wind Offshore", 
        "Wind Onshore", 
        # "Pumped Storage Hydroelectricity", 
        # "Geothermal" 
    ]

    retrieve_landarea = [
        "Anaerobic Digestion", 
        "Solar Photovoltaics", 
        "Sewage Sludge Digestion", 
    ]

    useful_fields_repd = [
        "Site Name",
        "Technology Type",
        "Operator (or Applicant)",
        "Installed Capacity (MWelec)", 
        "Turbine Capacity (MW)", 
        "No. of Turbines",
        "Address", 
        "County", 
        "Region",
        "Country",
        "Post Code",
        "Planning Authority",
        "Planning Application Reference",
        "Operational"        
    ]

    renewables_files = replacefilewildcards(renewables)
    osm_files = replacefilewildcards(osm)
    windfarm_propertyid = Property.objects.filter(name="Wind Farm").first().pk
    solarfarm_propertyid = Property.objects.filter(name="Solar Farm").first().pk
    renewables_ids = {'wind': windfarm_propertyid, 'solar': solarfarm_propertyid}
    all_government = list(Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_GOVERNMENT).values_list('external_id', flat=True))
    all_osm = list(Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_OSM).values_list('external_id', flat=True))

    Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_GOVERNMENT, external_id__in=all_government).delete()

    g = Geod(ellps='WGS84')

    outputfeatures = []
    for osm_file in osm_files:
        with open(osm_file, "r", encoding='UTF-8') as readerfileobj:
            geojson = json.loads(readerfileobj.read())

            relations, groups, individuals = {}, {}, []
            # Get all existing relations
            for feature in geojson['features']:
                featurecopy = copy(feature)
                if feature['properties']['type'] == 'relation':
                    relationid = feature['properties']['type'] + str(feature['properties']['id'])
                    featurecopy['properties'] = feature['properties']['tags']
                    featurecopy['properties']['id'] = relationid
                    featurecopy['properties'] = addrenewablesproperties(featurecopy['properties'], renewables_ids)
                    relations[relationid] = featurecopy

            # Find relations that are referred to and group together to calculate overall bbox
            for feature in geojson['features']:
                featurecopy = copy(feature)
                if feature['properties']['type'] != 'relation':
                    if len(feature['properties']['relations']) == 0:
                        individualid = feature['properties']['type'] + str(feature['properties']['id'])
                        properties = featurecopy['properties']['tags']
                        properties['id'] = individualid
                        properties = addrenewablesproperties(properties, renewables_ids)
                        # Don't include proposed sites
                        if properties['name'].startswith("Proposed "): continue
                        individuals.append({"type": "Feature", "properties": properties, "geometry": featurecopy['geometry']})
                    else:
                        relationid = "relation" + str(feature['properties']['relations'][0]['rel'])
                        properties = featurecopy['properties']['relations'][0]['reltags']
                        properties['id'] = relationid
                        properties = addrenewablesproperties(properties, renewables_ids)

                        # Check whether feature should be in group
                        # We only care about actual solar or wind not related infrastucture

                        if  (feature['properties']['relations'][0]['role'] in ['', 'generator']) & \
                            (feature['geometry']['type'] == "Point"):
                            if relationid not in groups: groups[relationid] = {'properties': properties, 'elements': []}
                            groups[relationid]['elements'].append(feature)

            # Create indexed bounding boxes in Django

            for relationid in relations.keys():
                bounds = shape(relations[relationid]['geometry']).bounds
                print("Adding overall area", relations[relationid]['properties']['name'])
                outputfeatures.append({ \
                    "type": "Feature", \
                    "properties": addcontext(relations[relationid]['properties'], relations[relationid]['geometry']), \
                    "geometry": relations[relationid]['geometry']\
                })
                entity = Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_OSM, external_id=relationid).first()
                if entity is None:
                    entity = Entity(source=EntitySourceType.ENTITYSOURCE_OSM, external_id=relationid)
                if relationid in all_osm: all_osm.remove(relationid)
                entity.status = EditTypes.EDIT_LIVE
                entity.name = relations[relationid]['properties']['name']
                entity.bbox = Polygon.from_bbox(bounds)
                entity.centre = Point(((bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2))
                entity.location = entity.centre
                viewableproperties = extractviewableproperties(relations[relationid]['properties'])
                entity.extraproperties = None
                if viewableproperties: entity.extraproperties = viewableproperties
                entity.save()
                if relations[relationid]['properties']['renewabletype'] == 'solar':
                    entity.properties.set([solarfarm_propertyid])
                if relations[relationid]['properties']['renewabletype'] == 'wind':
                    entity.properties.set([windfarm_propertyid])

            for relationid in groups.keys():
                geometrylist = []
                groups[relationid]['properties']['number:of:elements'] = len(groups[relationid]['elements'])
                print("Adding group of sites -", groups[relationid]['properties']['number:of:elements'], groups[relationid]['properties']['name'])
                for element in groups[relationid]['elements']:
                    bounds = shape(element['geometry']).bounds
                    geometrylist.append((bounds[0], bounds[1]))
                    geometrylist.append((bounds[2], bounds[3]))
                    # Add group element to outputfeatures but not searchable index
                    outputfeatures.append({ \
                        "type": "Feature", \
                        "properties": addcontext(groups[relationid]['properties'], element['geometry']), \
                        "geometry": element['geometry']\
                    })
                bounds = get_bounding_box_list(geometrylist)
                entity = Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_OSM, external_id=relationid).first()
                if entity is None:
                    entity = Entity(source=EntitySourceType.ENTITYSOURCE_OSM, external_id=relationid)
                if relationid in all_osm: all_osm.remove(relationid)
                entity.status = EditTypes.EDIT_LIVE
                entity.name = groups[relationid]['properties']['name']
                # Add padding to bounding box for wind as based on point coordinates and not width of turbine
                if groups[relationid]['properties']['renewabletype'] == 'wind': bounds = addwindpadding(bounds)
                entity.bbox = Polygon.from_bbox(bounds)
                entity.centre = Point(((bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2))
                entity.location = entity.centre
                viewableproperties = extractviewableproperties(groups[relationid]['properties'])
                entity.extraproperties = None
                if viewableproperties: entity.extraproperties = viewableproperties
                entity.save()
                if groups[relationid]['properties']['renewabletype'] == 'solar':
                    entity.properties.set([solarfarm_propertyid])
                if groups[relationid]['properties']['renewabletype'] == 'wind':
                    entity.properties.set([windfarm_propertyid])

            for feature in individuals:
                properties = feature['properties']
                print("Adding individual sites", properties['name'])
                outputfeatures.append({ \
                    "type": "Feature", \
                    "properties": addcontext(feature['properties'], feature['geometry']), \
                    "geometry": feature['geometry']\
                })
                id = str(properties['id'])
                if feature['geometry']["type"] == 'Point':
                    lon = feature['geometry']['coordinates'][0]
                    lat = feature['geometry']['coordinates'][1]
                    top_right_corner = g.fwd(lon, lat, 45, TURBINE_PADDING)
                    bottom_right_corner = g.fwd(lon, lat, 135, TURBINE_PADDING)
                    bottom_left_corner = g.fwd(lon, lat, 225, TURBINE_PADDING)
                    top_left_corner = g.fwd(lon, lat, 315, TURBINE_PADDING)
                    max_lon = top_right_corner[0]
                    max_lat = bottom_right_corner[1]
                    min_lon = bottom_left_corner[0]
                    min_lat = top_left_corner[1]
                    bounds = (max_lon, max_lat, min_lon, min_lat)
                else:
                    bounds = shape(feature['geometry']).bounds
                entity = Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_OSM, external_id=id).first()
                if entity is None:
                    entity = Entity(source=EntitySourceType.ENTITYSOURCE_OSM, external_id=id)
                if id in all_osm: all_osm.remove(id)
                entity.status = EditTypes.EDIT_LIVE
                entity.name = properties['name']
                entity.bbox = Polygon.from_bbox(bounds)
                entity.centre = Point(((bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2))
                entity.location = entity.centre
                viewableproperties = extractviewableproperties(properties)
                entity.extraproperties = None
                if viewableproperties: entity.extraproperties = viewableproperties
                entity.save()
                if properties['renewabletype'] == 'solar':
                    entity.properties.set([solarfarm_propertyid])
                if properties['renewabletype'] == 'wind':
                    entity.properties.set([windfarm_propertyid])

    print("Deleting objects not updated")
    Entity.objects.filter(external_id__in=all_osm).delete()
    with open(osm_output, "w", encoding='UTF-8') as writerfileobj:
        json.dump({"type": "FeatureCollection", "features": outputfeatures}, writerfileobj, indent=2)

def computerenewablesareas():
    """
    Computes area of renewables assets and determines MW/hectare for solar
    """

    windfarm_propertyid = Property.objects.filter(name="Wind Farm").first().pk
    solarfarm_propertyid = Property.objects.filter(name="Solar Farm").first().pk
    solar_osm = Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_OSM, properties=solarfarm_propertyid)

    with open(osm_output, "r", encoding='UTF-8') as readerfileobj: osm_geojson = json.load(readerfileobj)
        
    osm_lookup = {}
    for feature in osm_geojson['features']:
        area_hectares = calculatearea(feature['geometry']) / 10000
        if area_hectares > 4:
            entity = Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_OSM, external_id = feature['properties']['id']).first()
            if entity.extraproperties is None: extraproperties = {}
            else: extraproperties = json.loads(entity.extraproperties)
            if 'site:area' not in extraproperties: 
                extraproperties['site:area'] = str(round(area_hectares, 2)) + ' hectares'
                print(feature['properties']['id'], extraproperties)
                entity.extraproperties = json.dumps(extraproperties, indent=2)
                entity.save()

    # Calculate total power output and total area for solar assets
    totalpoweroutput, totalarea = 0.0, 0.0
    for entity in solar_osm:
        if entity.extraproperties is not None:
            extraproperties = json.loads(entity.extraproperties)
            poweroutput = None
            area = None

            if "plant:output:electricity" in extraproperties: poweroutput = extraproperties['plant:output:electricity']
            if "generator:output:electricity" in extraproperties: poweroutput = extraproperties['generator:output:electricity']
            if "site:area" in extraproperties: area = extraproperties['site:area']

            if poweroutput is not None:
                poweroutput = poweroutput.strip().upper().split()
                # Sanitize poweroutput if no space between value and units, eg. '250MW'
                if len(poweroutput) == 1:
                    if (poweroutput[0][-2:] == 'KW'): poweroutput = [poweroutput[0][:-2], 'KW']
                    if (poweroutput[0][-2:] == 'MW'): poweroutput = [poweroutput[0][:-2], 'MW']
                if len(poweroutput) == 2:
                    if poweroutput[1] == 'KW': 
                        poweroutput[0] = float(float(poweroutput[0]) / 1000)
                        poweroutput[1] = 'MW'

                    if (poweroutput[1] == 'MW') and (area is not None):
                        totalpoweroutput += float(poweroutput[0])
                        area = area.strip().split()
                        totalarea += float(area[0])

    print("MW / hectare ratio:", totalpoweroutput, totalarea, float(totalpoweroutput / totalarea))

def computerenewableswind():
    """
    Gets details of wind speed for all wind turbine sites
    """

    from turf import centroid, boolean_point_in_polygon

    with open(osm_output, "r", encoding='UTF-8') as readerfileobj: osm_geojson = json.load(readerfileobj)
    # with open(windspeed_geojson, "r", encoding='UTF-8') as readerfileobj: wind_geojson = json.load(readerfileobj)

    # osm_lookup = {}
    # windspeedindex = 1
    # for windspeedsector in wind_geojson['features']:
    #     print(windspeedindex)
    #     windspeedindex += 1

    outputfeatures = []
    for feature in osm_geojson['features']:
        if feature['properties']['renewabletype'] == 'wind':
            singlepoint = feature['geometry']['coordinates']
            # if len(feature['geometry']['coordinates']) > 2:
            #     singlepointcentroid = centroid(feature)
            #     singlepoint = singlepointcentroid['geometry']['coordinates']
            #     feature['geometry']['coordinates'] = singlepoint
            outputfeatures.append(feature)
            print(feature['properties']['name'], singlepoint)

    with open('gis/windturbines.geojson', "w", encoding='UTF-8') as writerfileobj:
        json.dump({"type": "FeatureCollection", "features": outputfeatures}, writerfileobj, indent=2)
                
    # with open(windspeed_geojson, "r", encoding='UTF-8') as readerfileobj: windspeeds = json.load(readerfileobj)
        
    # for entity in windfarm_osm:
    #     print(entity)
    #     if entity.extraproperties is not None:
    #         extraproperties = json.loads(entity.extraproperties)
    #         poweroutput = None
    #         area = None

    #         if "plant:output:electricity" in extraproperties: poweroutput = extraproperties['plant:output:electricity']
    #         if "generator:output:electricity" in extraproperties: poweroutput = extraproperties['generator:output:electricity']
    #         if "site:area" in extraproperties: area = extraproperties['site:area']

    #         if poweroutput is not None:
    #             poweroutput = poweroutput.strip().upper().split()
    #             # Sanitize poweroutput if no space between value and units, eg. '250MW'
    #             if len(poweroutput) == 1:
    #                 if (poweroutput[0][-2:] == 'KW'): poweroutput = [poweroutput[0][:-2], 'KW']
    #                 if (poweroutput[0][-2:] == 'MW'): poweroutput = [poweroutput[0][:-2], 'MW']
    #             if len(poweroutput) == 2:
    #                 if poweroutput[1] == 'KW': 
    #                     poweroutput[0] = float(float(poweroutput[0]) / 1000)
    #                     poweroutput[1] = 'MW'

    #                 if (poweroutput[1] == 'MW') and (area is not None):
    #                     totalpoweroutput += float(poweroutput[0])
    #                     area = area.strip().split()
    #                     totalarea += float(area[0])

    # print("MW / hectare ratio:", totalpoweroutput, totalarea, float(totalpoweroutput / totalarea))

def cleangrid():
    """
    Clean grid.geojson
    """

    with open(grid_geojson, "r", encoding='UTF-8') as readerfileobj: gridfeatures = json.load(readerfileobj)

    outputfeatures, outputfeatures_lines, outputfeatures_poles = [], [], []
    outputfeatures_lines_1, outputfeatures_lines_2, outputfeatures_lines_3, outputfeatures_lines_4 = [], [], [], []
    for feature in gridfeatures['features']:
        if 'voltage' in feature['properties']:
            maxvoltage = 0
            voltage = feature['properties']['voltage'].strip()
            if voltage.isnumeric() is True:
                maxvoltage = int(voltage)
                if maxvoltage < 1000: maxvoltage = (1000 * maxvoltage)
            else:
                if voltage == 'low': maxvoltage = 11000
                else:
                    if voltage == 'medium': maxvoltage = 33000
                    else:
                        voltage = voltage\
                            .lower()\
                            .replace('?', '11000')\
                            .replace(' ', '')\
                            .replace('_', '')\
                            .replace('/', ';')\
                            .replace(',', ';')\
                            .replace(":", ';')\
                            .replace('kv', '000')\
                            .replace('v', '')
                        voltageelements = voltage.split(";")
                        maxvoltage = 0
                        if voltageelements[0].isnumeric():
                            maxvoltage = int(voltageelements[0])
                            if maxvoltage < 1000: maxvoltage = (1000 * maxvoltage)
                            for element in voltageelements:
                                element = int(element)
                                # If voltage is less than 1000, must be kV
                                if element < 1000: element = (1000 * element)
                                if element > maxvoltage: maxvoltage = element
                            print(maxvoltage)
                        else: print("Couldn't parse", voltageelements[0])
            feature['properties']['maxvoltage'] = maxvoltage
        outputfeatures.append(feature)
        if feature['geometry']['type'] == 'Point': outputfeatures_poles.append(feature)
        else: 
            outputfeatures_lines.append(feature)
            if maxvoltage >= 310000: outputfeatures_lines_1.append(feature)
            elif maxvoltage >= 13200: outputfeatures_lines_2.append(feature)
            elif maxvoltage >= 3300: outputfeatures_lines_3.append(feature)
            else: outputfeatures_lines_4.append(feature)

    print("Outputting modified grid geojson")
    # with open(grid_geojson_output, "w", encoding='UTF-8') as writerfileobj:
    #     json.dump({"type": "FeatureCollection", "features": outputfeatures}, writerfileobj, indent=2)

    with open(grid_geojson_lines_1_output, "w", encoding='UTF-8') as writerfileobj:
        json.dump({"type": "FeatureCollection", "features": outputfeatures_lines_1}, writerfileobj, indent=2)

    with open(grid_geojson_lines_2_output, "w", encoding='UTF-8') as writerfileobj:
        json.dump({"type": "FeatureCollection", "features": outputfeatures_lines_2}, writerfileobj, indent=2)

    with open(grid_geojson_lines_3_output, "w", encoding='UTF-8') as writerfileobj:
        json.dump({"type": "FeatureCollection", "features": outputfeatures_lines_3}, writerfileobj, indent=2)

    with open(grid_geojson_lines_4_output, "w", encoding='UTF-8') as writerfileobj:
        json.dump({"type": "FeatureCollection", "features": outputfeatures_lines_4}, writerfileobj, indent=2)

    # with open(grid_geojson_poles_output, "w", encoding='UTF-8') as writerfileobj:
    #     json.dump({"type": "FeatureCollection", "features": outputfeatures_poles}, writerfileobj, indent=2)

    print("Finished outputting modified grid geojson")


def importgroups():
    """
    Imports environmental groups data
    """

    groupfiles = replacefilewildcards(groups)
    groupproperties = list(Property.objects.filter(name="Volunteering").values_list('pk', flat=True)) 

    with open("gis/UK_large.geojson") as f:
        features = json.load(f)["features"]

    ukgeojson = [GEOSGeometry(str(feature["geometry"])) for feature in features]
    groupcount = 0
    for groupfile in groupfiles:
        if os.path.isfile(groupfile):
            file_name, file_extension = os.path.splitext(groupfile)
            file_name = os.path.basename(file_name)
            prefix = ''
            if file_name == 'transition': prefix = 'Transition Network - '
            with open(groupfile, 'r', encoding="utf-8-sig") as readerfileobj:
                groupjson = json.loads(readerfileobj.read())
                if file_extension == '.geojson':
                    features = groupjson['features']
                    
                if file_extension == '.json':
                    keys = dict.keys(groupjson)
                    for key in keys:
                        group = groupjson[key]
                        newpoint = Point(float(group['lng']), float(group['lat']))
                        contained = False
                        for poly in ukgeojson:
                            if poly.contains(newpoint): 
                                contained = True

                        if contained:
                            groupcount += 1
                            title = HTMLEntitiesToUnicode(group['title'])
                            if prefix != '': title = prefix + title
                            entity = Entity.objects.filter(source=EntitySourceType.ENTITYSOURCE_NGO, name=title).first()
                            if entity is None: entity = Entity(source=EntitySourceType.ENTITYSOURCE_NGO, name=title)
                            entity.status = EditTypes.EDIT_LIVE
                            entity.website = group['permalink']
                            entity.location = newpoint
                            entity.centre = newpoint
                            if file_name == 'transition':
                                urlelements = group['permalink'].strip('/').split('/')
                                lastelement = urlelements[-1:][0]
                                entity.external_id = 'transition-' + lastelement 
                            entity.bbox = Polygon.from_bbox(boundingBox(float(group['lat']), float(group['lng']), 0.5))
                            entity.save()
                            entity.properties.set(groupproperties)
                            print("Processing group", groupcount)





if len(sys.argv) == 1:
    print("""
****** Carbon Map Batch Processing *******

Possible arguments are:

checkgeometries
  Check whether any geometries are corrupted

importlocations
  Imports location data from file that is used to geolocate specific locations

importcontexts
  Imports multiple geographical contexts using JSON GIS files

assigntocontexts
  Calculate which geometries should belong to specific contexts due to containment
          
generategeometries
  Generates multiple geometries of boundaries for multiple zoom levels using simplification

generatesinglegeometries
  Generates geometries of boundaries for single zoom level using simplification

processspecialcases
  Perform additional ad-hoc processing

updateshortcodes
  Update shortcodes for all entities

resetshortcodes
  Resets shortcodes for all entities
                    
importentities
  Imports entity data from 'entities' folder

updateentities
  Updates all live entities in case there are pre-save actions that need to be run since last import
          
importproperties
  Imports properties data from 'properties' folder

importfunding
  Imports funding data from 'funding' folder
          
contextualizedata
  Adds context to data spreadsheet based on its 'lat' and 'lng' column values

updatepostcodes
  Updates postcodes database using OS data

processrenewables
  Process BEIS renewables locations data

computerenewablesareas
  Computes area of renewables assets and determines MW/hectare for solar

computerenewableswind
  Gets details of wind speed for all wind turbine sites

cleangrid
  Cleans grid.geojson
                   
importgroups
  Process environmental group data

importdata [lsoa/msoa/lau1] [yearstart] [yearend]
  Imports data for specific area scale and year range (assuming BEIS data)
  Leaving off [yearend] will only import for [yearstart]
""")

else:
    primaryargument = sys.argv[1]

    if primaryargument == "checkgeometries":
        checkgeometries()
    if primaryargument == "importlocations":
        importlocations()
    if primaryargument == "importcontexts":
        importcontexts()
    if primaryargument == "assigntocontexts":
        assigntocontexts()
    if primaryargument == "generategeometries":
        generategeometries()
    if primaryargument == "generatesinglegeometries":
        generatesinglegeometries()
    if primaryargument == "processspecialcases":
        processspecialcases()
    if primaryargument == "updateshortcodes":
        updateshortcodes()
    if primaryargument == "resetshortcodes":
        resetshortcodes()
    if primaryargument == "importentities":
        importentities()
    if primaryargument == "updateentities":
        updateentities()
    if primaryargument == "importproperties":
        importproperties()
    if primaryargument == "importfunding":
        importfunding()
    if primaryargument == "contextualizedata":
        contextualizedata()
    if primaryargument == "updatepostcodes":
        updatepostcodes()
    if primaryargument == "processrenewables":
        processrenewables()
    if primaryargument == "computerenewablesareas":
        computerenewablesareas()
    if primaryargument == "computerenewableswind":
        computerenewableswind()
    if primaryargument == "cleangrid":
        cleangrid()
    if primaryargument == "importgroups":
        importgroups()
    if primaryargument == "importdata":
        if len(sys.argv) >= 4:
            yearstart = sys.argv[3]
            yearend = yearstart
            if len(sys.argv) == 5: yearend = sys.argv[4]
            geometrytype = sys.argv[2]
            importdata(geometrytype, yearstart, yearend)    
        else:
            print("Not enough arguments provided for importdata. Format is importdata lsoa/msoa/lau1 yearstart yearend")


