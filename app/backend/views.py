"""
Copyright (c) Positive Farms, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/views.py
Django views for rendering default React page and delivering data to frontend
"""

import json
import re
import html
import os
import urllib
from html.parser import HTMLParser
from urllib.parse import urlparse
from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from django.contrib.auth.models import User
from django.contrib.gis.geos import Polygon, GEOSGeometry, Point
from django.contrib.gis.db.models import Extent
from django.core.serializers import serialize
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.geos import Polygon
from django.contrib.gis.db.models.aggregates import Union
from django.contrib.gis.db.models.functions import AsGeoJSON, Centroid, Distance, Envelope
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib.sites.shortcuts import get_current_site
from django.template.loader import render_to_string, get_template
from django.core.mail import EmailMessage
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from guardian.shortcuts import get_objects_for_user, assign_perm
from shapely.geometry import MultiPolygon

from rest_framework.renderers import TemplateHTMLRenderer
from rest_framework import serializers
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from ukpostcodeutils import validation

from .models import \
    Property, \
    PropertyTypes, \
    Location, \
    Context, \
    Geometry, \
    GeometryTypes, \
    GeometryCode, \
    Entity, \
    EditTypes, \
    Post, \
    Message
from .gis import get_postcode_point
from .serializers import OrganisationSerializer
from .functions import format_address, remove_html_tags
from .forms import SignUpForm, UserForm, FarmForm, PostForm
from .tokens import account_activation_token

GOOGLE_RECAPTCHA_SECRET_KEY = os.environ.get("GOOGLE_RECAPTCHA_SECRET_KEY")

MAX_ZOOM = 15

# Zoom level for all postcode searches
POSTCODE_ZOOM = 13

def OutputJson(json_array={'result': 'failure'}):
    json_data = json.dumps(json_array, cls=DjangoJSONEncoder, indent=2)
    return HttpResponse(json_data, content_type="text/json")

def OutputError():
    return OutputJson()

def home(request):
    """
    Shows default home page or other frontend-specific pages to be rendered by frontend React app
    """
    return render(request, 'index.html')

@csrf_exempt
def Geometries(request):
    """
    Get all geometries within boundary box for particular zoom level
    """

    try:
        data = json.loads(request.body)
    except ValueError:
        return OutputError()

    # If context shortcode, create context object
    context = None
    if 'context' in data: 
        context = Context.objects.filter(shortcode=data['context']).first()

    zoom, xmin, ymin, xmax, ymax = data['zoom'], data['xmin'], data['ymin'], data['xmax'],data['ymax']

    # print(type, zoom, xmin, ymin, xmax, ymax)

    bbox = (xmin, ymin, xmax, ymax)
    geometry = Polygon.from_bbox(bbox)

    if zoom < 13:
        selectedfeatures = Entity.objects.filter(status=EditTypes.EDIT_LIVE).values('name', 'geometrycodes__code')
        selected_codes = list(set([feature['geometrycodes__code'] for feature in selectedfeatures]))
        if context is None:
            allfeatures = Geometry.objects.filter(zoom=MAX_ZOOM, geometry__bboverlaps=geometry).filter(code__in=selected_codes).annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'type', 'json')
        else:
            allfeatures = Geometry.objects.filter(zoom=MAX_ZOOM, geometry__bboverlaps=geometry).filter(geometry__intersects=context.geometry).filter(code__in=selected_codes).annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'type', 'json')
    else:
        zoom = MAX_ZOOM
        if context is None:
            allfeatures = Geometry.objects.filter(zoom=zoom, geometry__bboverlaps=geometry).annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'type', 'json')
        else:
            allfeatures = Geometry.objects.filter(zoom=zoom, geometry__bboverlaps=geometry).filter(geometry__intersects=context.geometry).annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'type', 'json')
        feature_codes = [feature['code'] for feature in allfeatures]
        selectedfeatures = Entity.objects.filter(status=EditTypes.EDIT_LIVE, geometrycodes__code__in=feature_codes).values('name', 'geometrycodes__code')

    selectedcodes = list(set([feature['geometrycodes__code'] for feature in selectedfeatures]))
    entitylookup = {feature['geometrycodes__code']: feature['name'] for feature in selectedfeatures}

    json_data = {'features': list(allfeatures), 'active': {'geometrycodes': selectedcodes, 'entitylookup': entitylookup}}
    return OutputJson(json_data)

@csrf_exempt
def Properties(request):
    """
    Get all properties
    """

    return OutputJson(list(Property.objects.all().order_by('name').values()))

@csrf_exempt
def Search(request):
    """
    Get search results for particular search text
    """

    try:
        searchcriteria = json.loads(request.body)
    except ValueError:
        return OutputError()

    # data = {'context': 'cambridgeshire', 'searchtext': 'farm'}
    searchtext = searchcriteria['searchtext'].strip()
    searchresults = []
    defaultzoom = 15
    mapcentre = None

    # If map centre indicated, create mapcentre object
    mapcentre = None
    if 'lat' in searchcriteria and 'lng' in searchcriteria:
        mapcentre = Point(searchcriteria['lng'], searchcriteria['lat'], srid=4326)

    # If context shortcode, create context object
    context = None
    if 'context' in searchcriteria: 
        context = Context.objects.filter(shortcode=searchcriteria['context']).first()

    if len(searchtext) == 0:
        # Get top 10 results within locality

        entities = Entity.objects.filter(status=EditTypes.EDIT_LIVE)    
        if mapcentre is None:
            entities = entities.order_by('name')
        else:          
            entities = entities.annotate(distance=Distance('centre' , mapcentre )).order_by('distance')

        if context is not None:
            entities = entities.filter(centre__intersects=context.geometry)

        entities = entities[:10]

        for entity in entities:
            searchresults.append({'type': 'entity', 'name': entity.name, 'id': entity.id, 'external_id': entity.external_id})

        return OutputJson({'searchtext': searchtext, 'results': searchresults})

    if len(searchtext) < 3: return OutputJson({'searchtext': searchtext, 'results': searchresults})

    # Check to see whether it's postcode

    postcodetext = re.sub("[^0-9a-zA-Z]+", "", searchtext).upper()   
    if validation.is_valid_postcode(postcodetext):
        # UK postcodes always have three characters in second half
        postcodetext_formatted = postcodetext[:-3] + ' ' + postcodetext[-3:]
        location = get_postcode_point(postcodetext)
        if (context is None) or location.intersects(context.geometry):
            searchresults = [{'type': 'postcode', 'name': postcodetext_formatted, 'lat': location[1], 'lng': location[0], 'zoom': defaultzoom}]
    else:
    
        # If not postcode, do text search on business type, all contexts, geographies and entities

        # Context-independent properties
        properties = Property.objects.filter(name__icontains=searchtext)
        for property in properties:
            searchresults.append({'type': 'selection', 'name': property.name, 'id': property.id})

        # Context-dependent entities
        entities = Entity.objects.filter(status=EditTypes.EDIT_LIVE, name__icontains=searchtext).order_by('name')
        if context is not None:
            entities = entities.filter(centre__intersects=context.geometry)

        for entity in entities:
            searchresults.append({'type': 'entity', 'name': entity.name, 'id': entity.id, 'external_id': entity.external_id})

        # Context-dependent locations
        locations = None
        if ',' in searchtext:
            searchelements = searchtext.split(',')
            town, county = searchelements[0].strip(), searchelements[1].strip()
            locations = Location.objects.filter(town__icontains=town).filter(county__icontains=county).order_by('town')
        else:
            locations = Location.objects.filter(town__icontains=searchtext).order_by('town')    
        if context is not None:
            locations = locations.filter(location__intersects=context.geometry)

        if locations:
            for location in locations:
                if location.location is not None:
                    name = location.town + ", " + location.county
                    searchresults.append({'type': 'location', 'name': name, 'lat': location.location[1], 'lng': location.location[0], 'zoom': location.scale})

        # If context, don't search on contexts
        if context is None:
            contexts = Context.objects.filter(name__icontains=searchtext).annotate(Extent('geometry')).order_by('name')        
            for context in contexts:
                searchresults.append({'type': 'context', 'name': context.name, 'bounds': context.geometry__extent})

    return OutputJson({'searchtext': searchtext, 'results': searchresults})

@csrf_exempt
def Entities(request):
    """
    Get info and properties of particular entities using search criteria
    """

    try:
        searchcriteria = json.loads(request.body)
    except ValueError:
        return OutputError()

    # If map centre indicated, create mapcentre object
    mapcentre = None
    if 'lat' in searchcriteria and 'lng' in searchcriteria:
        mapcentre = Point(searchcriteria['lng'], searchcriteria['lat'], srid=4326)

    # If context shortcode, create context object
    context = None
    if 'context' in searchcriteria: 
        context = Context.objects.filter(shortcode=searchcriteria['context']).first()

    # Set up output results
    results = {'list': False}
    # If list, then delete potentially large related data
    if ('list' in searchcriteria):
        if (searchcriteria['list'] is True): 
            results['list'] = True

    # Build query for search results
    entities = None

    if 'id' in searchcriteria:
        entities = Entity.objects.filter(status=EditTypes.EDIT_LIVE).filter(pk=searchcriteria['id'])
    elif searchcriteria['list'] is False:
        print("list=False but no entity id specified")
        return OutputError()

    if 'properties' in searchcriteria:
        entity_ids = Entity.objects.filter(status=EditTypes.EDIT_LIVE)\
                        .filter(properties__in=searchcriteria['properties']).values_list('pk')
        entities = Entity.objects.filter(pk__in=entity_ids)

    entities = entities\
        .annotate(properties_list=ArrayAgg('properties'))\
        .annotate(geometrycodes_list=ArrayAgg('geometrycodes'))\
        .annotate(bbox_extent=Extent('bbox'))
    
    if mapcentre is None:
        entities = entities.order_by('name')
    else:          
        entities = entities.annotate(distance=Distance('centre' , mapcentre )).order_by('distance')

    # We don't apply context if retrieving single entity
    if context is not None and searchcriteria['list'] is True:
        entities = entities.filter(centre__intersects=context.geometry)

    outputentities = []
    for entity in entities:

        outputentity = {\
            'id': entity.id,\
            'name': entity.name,\
            'external_id': entity.external_id,\
            'img': entity.img,\
            'address': format_address(entity.address, entity.postcode),\
            'desc': entity.desc,\
            'website': entity.website,\
            'properties': list(Property.objects.filter(pk__in=entity.properties_list).order_by('name').values()),\
            'bounds': entity.bbox_extent,\
            'geometrycodes': []\
            }

        if entity.email.strip() != '':
            outputentity['contactable'] = True

        if results['list'] is False: 
            geometrycodes_ids = list(set(entity.geometrycodes_list))
            if len(geometrycodes_ids) != 0:
                outputentity['geometrycodes'] = list(GeometryCode.objects\
                                                     .filter(pk__in=geometrycodes_ids).values_list('code', flat=True))
            outputentity['data'] = entity.data
            posts = list(Post.objects.filter(entity=entity.id).order_by('-date').values())
            if posts is not None:
                outputentity['posts'] = posts

        outputentities.append(outputentity)

    results['entities'] = outputentities

    bounds = entities.aggregate(Extent('bbox'))['bbox__extent']
    if bounds: results['bounds'] = bounds

    return OutputJson(results)

@csrf_exempt
def GetContext(request, context_shortcode):
    """
    Get context, ie. details of particular area 
    """

    context_shortcode = context_shortcode.lower()
    context = Context.objects.filter(shortcode=context_shortcode)\
        .annotate(Extent('geometry'))\
        .annotate(geojson=AsGeoJSON('geometry'))\
        .values('id', 'name', 'shortcode', 'geometry__extent', 'geojson').first()
    context['geojson'] = json.loads(context['geojson'])
    context['bounds'] = context['geometry__extent']
    del context['geometry__extent']
    return OutputJson(context)

@csrf_exempt
def GeometryBounds(request):
    """
    Get bounds of particular area
    """

    try:
        data = json.loads(request.body)
    except ValueError:
        return OutputError()

    area = Geometry.objects.filter(zoom=15, code=data['code']).annotate(Extent('geometry')).values('type', 'geometry__extent').first()
    json_data = {'rect': area['geometry__extent']}
    return OutputJson(json_data)

@csrf_exempt
def ExternalRef(request, externalref):
    """
    Lookup entity based on external ref or website
    """

    externalref = re.sub(r'https?://', '', externalref).strip("/")
    entity = Entity.objects.filter(status=EditTypes.EDIT_LIVE, external_id__icontains=externalref) | Entity.objects.filter(status=EditTypes.EDIT_LIVE, website__icontains=externalref)
    entity = entity.order_by('pk').values_list('pk', flat=True)
    if len(entity) == 0:
        return OutputJson(None)
    else:
        return OutputJson(entity[0])

class Organisations(APIView):
    """
    List all organisations
    """
    http_method_names = ['get']
    permission_classes = ()
    authentication_classes = ()

    @csrf_exempt
    def get(self, request, format=None):
        if 'name' in request.GET:
            organisations = Entity.objects.filter(status=EditTypes.EDIT_LIVE, name__icontains=request.GET['name']).order_by('external_id')
        else:
            organisations = Entity.objects.filter(status=EditTypes.EDIT_LIVE).order_by('external_id')
        serializer = OrganisationSerializer(organisations, many=True)
        return Response(serializer.data)

class SingleOrganisation(APIView):
    """ 
    Display data for single organisation 
    """
    http_method_names = ['get']

    def get(self, request, shortcode, format=None):
        shortcode = re.sub("[^0-9a-zA-Z\-\.]+", "", shortcode).lower()

        # We assume only one live organisation with specific shortcode 

        organisation = Entity.objects.filter(status=EditTypes.EDIT_LIVE, external_id=shortcode).annotate(properties_list=ArrayAgg('properties')).annotate(geometrycodes_list=ArrayAgg('geometrycodes')).first()
        if organisation is None:
            data = returndata = {"name": "Not found"}
        else:
            geometrycodes_ids = list(set(organisation.geometrycodes_list))
            geometrycodes = list(GeometryCode.objects.filter(pk__in=geometrycodes_ids).values_list('code', flat=True))
            properties = list(Property.objects.filter(pk__in=organisation.properties_list).order_by('type', 'name').values())
            for propertykey in range(len(properties)):
                properties[propertykey] = {'type': PropertyTypes.choices[properties[propertykey]['type']][1] , \
                                           'name': properties[propertykey]['name'] }

            data = {    "id": organisation.external_id, \
                        "name": organisation.name, \
                        "address": format_address(organisation.address, organisation.postcode), \
                        "desc": remove_html_tags(organisation.desc).strip(), \
                        "website": organisation.website, \
                        "properties": properties,
                        "polygons": geometrycodes, \
                        "data": organisation.data }

        return Response(data)

@csrf_exempt
def LocationPosition(request):
    """
    Get coordinates for location or postcode
    """

    locationtext = request.GET.get('location').strip()

    location, zoom, result = None, POSTCODE_ZOOM, {'result': 'failure'}
    postcodetext = re.sub("[^0-9a-zA-Z]+", "", locationtext).upper()   

    if validation.is_valid_postcode(postcodetext):
        location = get_postcode_point(postcodetext)
    else:
        locationrecord = Location.objects.filter(town__iexact=locationtext).first()
        if (locationrecord is not None):
            location = locationrecord.location
            zoom = locationrecord.scale

    if location:
        result = {'result': 'success', 'data': {'lat': location[1], 'lng': location[0], 'zoom': zoom}}

    return OutputJson(result)

@csrf_exempt
def SendMessage(request):
    """
    Send message - typically to Entity
    """

    try:
        data = json.loads(request.body)
        data['entityid'] = int(data['entityid'])
    except ValueError:
        return OutputError()

    ''' Begin reCAPTCHA validation '''

    recaptcha_response = data['recaptcha']
    url = 'https://www.google.com/recaptcha/api/siteverify'
    values = {
        'secret': GOOGLE_RECAPTCHA_SECRET_KEY,
        'response': recaptcha_response
    }
    recaptchadata = urllib.parse.urlencode(values).encode()
    req =  urllib.request.Request(url, data=recaptchadata)
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode())

    ''' End reCAPTCHA validation '''

    if result['success']:
        entity = Entity.objects.filter(pk=data['entityid']).first()
        if entity is not None:
            sendemail = entity.email.strip()
            if sendemail != '':
                data['name'] = re.sub("[^0-9a-z \.\-'A-Z]+", "", data['name'])
                # Save message in database
                message = Message.objects.create(entity=entity, name=data['name'], email_from=data['email'], email_to=sendemail, message=data['message'])
                message.save()
                # Attempt to send email
                from_email = '"' + data['name'] + '" <' + data['email'] + '>'
                subject = "Message sent via Positive Farms - from " + data['name']
                message = render_to_string('backend/messaging.html', data)
                message = EmailMessage(subject, message, from_email=from_email, to=[sendemail])
                message.send()
                return OutputJson({'result': 'success'})

    return OutputError()

# Account-specific functions

@login_required
def account(request):
    return render(request, 'backend/account.html', {})

def signup(request):
    if request.user.is_authenticated:
        return redirect('account')

    if request.method == 'POST':
        form = SignUpForm(request.POST)
        if form.is_valid():

            ''' Begin reCAPTCHA validation '''

            recaptcha_response = request.POST.get('g-recaptcha-response')
            url = 'https://www.google.com/recaptcha/api/siteverify'
            values = {
                'secret': GOOGLE_RECAPTCHA_SECRET_KEY,
                'response': recaptcha_response
            }
            data = urllib.parse.urlencode(values).encode()
            req =  urllib.request.Request(url, data=data)
            response = urllib.request.urlopen(req)
            result = json.loads(response.read().decode())

            ''' End reCAPTCHA validation '''

            if result['success']:
                user = form.save()
                user.refresh_from_db()  # Load the profile instance created by the signal.
                user.last_name = form.cleaned_data.get('organisation')
                user.is_active = False
                user.save()
                # Create farm using supplied details
                farm = Entity(  status=EditTypes.EDIT_PUBLISH, \
                                name=form.cleaned_data.get('organisation'), \
                                address=form.cleaned_data.get('address'), \
                                postcode=form.cleaned_data.get('postcode'), \
                                website=form.cleaned_data.get('website'), \
                                data={})
                farm.user = user
                farm.save()
                farm.properties.set(form.cleaned_data.get('type') | form.cleaned_data.get('actions'))
                creategeometriesforentity(farm.pk, form.cleaned_data.get('GeoJSON'))
                current_site = get_current_site(request)
                subject = 'Positive Farms'   
                message = render_to_string('backend/confirm_email.html', {
                    'user': user,
                    'domain': current_site.domain,
                    'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                    'token': account_activation_token.make_token(user),
                })
                user.email_user(subject, message)
                return redirect('email_sent')
            else:
                form.add_error(None, "Please click 'I'm not a robot'")
    else:
        form = SignUpForm()
    return render(request, 'backend/signup.html', {'form': form})

def email_sent(request):
    return render(request, 'backend/email_sent.html')

def email_confirmed(request):
    return render(request, 'backend/email_confirmed.html')

def email_not_confirmed(request):
    return render(request, 'backend/email_not_confirmed.html')

def confirm_email(request, uidb64, token):
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=uid)
        print(uid, user)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and account_activation_token.check_token(user, token):
        user.is_active = True
        user.profile.email_is_confirmed = True
        user.save()
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        return render(request, 'backend/email_confirmed.html')
    else:
        return render(request, 'backend/email_not_confirmed.html')

@login_required
def deactivate_confirm(request):
    return render(request, 'backend/deactivate_confirm.html')

@login_required
def deactivate(request):
    user = request.user
    user.is_active = False
    user.save()
    return render(request, 'backend/deactivate.html')

def postRequest(url, head=None, body=None, timeout=10):
    req = urllib.request.Request(url)
    req.add_header("Content-Type", "application/json")
    if head:
        for k in head:
            req.add_header(k,head[k])
    if body:
        body = json.dumps(body).encode('utf-8')
    try:
        resp = urllib.request.urlopen(req, body, timeout=timeout) if body else urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.HTTPError as err:
        print("code=%s, reason=%s" % (err.code, err.reason))
        return None
    data = b""
    for buff in iter(lambda: resp.read(65535), b''): data += buff
    returnedContentType = resp.getheader("Content-Type")
    return json.loads(data.decode("utf-8")) if "application/json" in returnedContentType else data

def calculateCentreBBox(entityid):
    entity = Entity.objects.filter(pk=entityid).annotate(geometrycodes_list=ArrayAgg('geometrycodes')).first()
    if entity is None: return
    geometrycodes_ids = list(set(entity.geometrycodes_list))
    geometrycodes = list(set(GeometryCode.objects.filter(pk__in=geometrycodes_ids).values_list('code', flat=True)))
    bounds = Geometry.objects.filter(zoom=15,code__in=geometrycodes).aggregate(Extent('geometry'))['geometry__extent']
    if bounds is None: return
    entity.centre = Point(((bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2))
    entity.bbox = Polygon.from_bbox(bounds)
    entity.save()

def creategeometriesforentity(entityid, GeoJSON):
    entities = Entity.objects.filter(pk=entityid).annotate(geometrycodes_list=ArrayAgg('geometrycodes'))
    if entities is None: return
    entity = entities.first()
    entitygeometries = Geometry.objects.filter(entity=entity)
    entitygeometries_codes = entitygeometries.values_list('code', flat=True)

    # Delete all internal geometrycodes and all geometries that are connected to entity
    GeometryCode.objects.filter(code__in=entitygeometries_codes).delete()
    entitygeometries.delete()

    index, entity_geometrycode_base = 0, "INTERNAL:" + str(entityid) + ":"
    geometrycodes_ids = []

    GeoJSON = GeoJSON.strip()
    if GeoJSON != "":
        GeoJSON = json.loads(GeoJSON)
        for feature in GeoJSON['features']:
            index += 1
            code = entity_geometrycode_base + str(index)
            geometry = GEOSGeometry(str(feature['geometry']))
            geometryobject = Geometry(  type=GeometryTypes.GEOMETRY_INTERNAL, \
                                        name=code, \
                                        code=code, \
                                        zoom=15, \
                                        entity=entity, \
                                        geometry=geometry )        
            geometryobject.save() 
            geometrycode = GeometryCode(code=code)
            geometrycode.save()
            geometrycodes_ids.append(geometrycode.pk)

        entity.geometrycodes.set(geometrycodes_ids)  

        # If making entity live, then calculate centroid for search purposes
        if entity.status == EditTypes.EDIT_LIVE: calculateCentreBBox(entityid)


@login_required
def farm(request, farmid):
    if farmid == 'new':
        farm = Entity()
        if request.method == 'POST':
            farm_form = FarmForm(request.POST, request=request, instance=farm)
            if farm_form.is_valid():
                farm = Entity(  status = farm_form.cleaned_data.get('status'), \
                                name=farm_form.cleaned_data.get('name'), \
                                address=farm_form.cleaned_data.get('address'), \
                                postcode=farm_form.cleaned_data.get('postcode'), \
                                website=farm_form.cleaned_data.get('website'), \
                                email=farm_form.cleaned_data.get('email'), \
                                desc=farm_form.cleaned_data.get('desc'), \
                                data={})
                farm.user = request.user
                farm.save()
                creategeometriesforentity(farm.pk, farm_form.cleaned_data.get('GeoJSON'))
                farm.properties.set(farm_form.cleaned_data.get('type') | farm_form.cleaned_data.get('actions'))
                return redirect('account')
        else:
            farm_form = FarmForm(request=request, instance=farm, initial={'email': request.user.email})
    else:
        farms = get_objects_for_user(request.user, ['backend.change_entity'], \
                    Entity.objects.filter(pk=farmid)\
                        .annotate(properties_list=ArrayAgg('properties'))\
                        .annotate(geometrycodes_list=ArrayAgg('geometrycodes')))
        if (farms.count() == 0): return redirect('account')
        farm = farms.first()
        if request.method == 'POST':
            farm_form = FarmForm(request.POST, request=request, instance=farm)
            if farm_form.is_valid():
                farm.user = request.user
                farm = farm_form.save()
                farm.status = farm_form.cleaned_data.get('status')
                farm.name = farm_form.cleaned_data.get('name')
                farm.address = farm_form.cleaned_data.get('address')
                farm.postcode = farm_form.cleaned_data.get('postcode')
                farm.website = farm_form.cleaned_data.get('website')
                farm.email = farm_form.cleaned_data.get('email')
                farm.desc = farm_form.cleaned_data.get('desc')
                farm.properties.set(farm_form.cleaned_data.get('type') | farm_form.cleaned_data.get('actions'))
                farm.save()
                creategeometriesforentity(farm.pk, farm_form.cleaned_data.get('GeoJSON'))
                return redirect('account')
        else:
            geometrycodes_ids = list(set(farm.geometrycodes_list))
            geometrycodes = GeometryCode.objects.filter(pk__in=geometrycodes_ids).values_list('code', flat=True)
            geometries = Geometry.objects.filter(zoom=15,code__in=geometrycodes).annotate(json=AsGeoJSON('geometry'))
            features = []
            for geometry in geometries:
                features.append({ 'type': 'Feature', 'properties': {'name': geometry.name}, 'geometry': json.loads(geometry.json) })
            featurecollection = { 'type': 'FeatureCollection', 'features': features }
            GeoJSON, location = '', ''
            if len(features) != 0: GeoJSON = json.dumps(featurecollection)
            if farm.location is not None: location = [farm.location[1], farm.location[0]]

            farm_form = FarmForm(   request=request, \
                                    instance=farm, \
                                    initial={\
                                        'type': farm.properties_list, \
                                        'actions': farm.properties_list, \
                                        'location': location, \
                                        'GeoJSON': GeoJSON \
                                    })

    context = {
        'farm_form': farm_form,
    }

    return render(request, 'backend/farm.html', context)

@login_required
def post(request, postid):
    if postid == 'new':
        post = Post()
        if request.method == 'POST':
            post_form = PostForm(request.POST, request=request, instance=post)
            if post_form.is_valid():
                post = Post(    entity=post_form.cleaned_data.get('entity'), \
                                title=post_form.cleaned_data.get('title'), \
                                text=post_form.cleaned_data.get('text') )
                post.user = request.user
                post.save()
                return redirect('account')
        else:
            farm = get_objects_for_user(request.user, ['backend.view_entity'], Entity.objects.all()).first()
            post_form = PostForm(request=request, instance=post, initial={'entity': farm})
    else:
        posts = get_objects_for_user(request.user, ['backend.change_post'], Post.objects.filter(pk=postid))
        if (posts.count() == 0): return redirect('account')
        post = posts.first()

        if request.method == 'POST':
            post_form = PostForm(request.POST, request=request, instance=post)
            if post_form.is_valid():
                post.user = request.user
                post = post_form.save()
                post.title = post_form.cleaned_data.get('title')
                post.text = post_form.cleaned_data.get('text')
                post.save()
                return redirect('account')
        else:
            post_form = PostForm(request=request, instance=post)

    context = {
        'post_form': post_form,
    }

    return render(request, 'backend/post.html', context)

@login_required
def delete(request, type, id):

    if request.method == 'POST':
        if type == 'post':
            get_objects_for_user(request.user, ['backend.change_post'], Post.objects.filter(pk=id)).delete()
        if type == 'farm':
            get_objects_for_user(request.user, ['backend.change_entity'], Entity.objects.filter(pk=id)).delete()
        return redirect('account')
    
    context = {
        'type': type,
        'id': id
    }

    return render(request, 'backend/delete.html', context)

