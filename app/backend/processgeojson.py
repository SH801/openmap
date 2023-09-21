
import json

solar_id, wind_id = 111, 110 
osm_input_file = "osm/renewables.geojson"
osm_output_file = "osm/renewables_modified.geojson"
featurecollection, newfeatures = {}, []
with open(osm_input_file, "r", encoding='UTF-8') as readerfileobj:
    featurecollection = json.load(readerfileobj)
    for feature in featurecollection['features']:
        if (feature['geometry']['type'] == 'Point') or \
            (feature['geometry']['type'] == 'Polygon') or \
            (feature['geometry']['type'] == 'MultiPolygon'):
            if 'proposed:power' in feature['properties']: continue
            if 'barrier' in feature['properties']: continue
            if 'highway' in feature['properties']: continue
            isSolar, isWind = False, False
            if 'generator:source' in feature['properties']:
                if feature['properties']["generator:source"] == "solar": isSolar = True
                if feature['properties']["generator:source"] == "wind": isWind = True
            if 'plant:source' in feature['properties']:
                if feature['properties']["plant:source"] == "solar": isSolar = True
                if feature['properties']["plant:source"] == "wind": isWind = True
            if isSolar:     feature['properties']['entityproperties'] = ["'" + str(solar_id) + "'"]
            if isWind:      feature['properties']['entityproperties'] = ["'" + str(wind_id) + "'"]
            if isSolar or isWind:
                newfeatures.append(feature)
            else:
                print("Rejecting", feature['properties'])
    featurecollection['features'] = newfeatures

with open(osm_output_file, "w", encoding='UTF-8') as writerfileobj:
    json.dump(featurecollection, writerfileobj, indent=2)