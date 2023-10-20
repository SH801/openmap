"""
Copyright (c) Positive Farms, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/models.py
Django models
"""

import re
from django import forms
from django.db import models
from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry, Point
from django.contrib.gis.admin import OSMGeoAdmin
from django.dispatch import receiver
from django.db.models.signals import pre_save, post_save, pre_delete
from guardian.forms import BaseObjectPermissionsForm
from guardian.admin import GuardedModelAdmin
from guardian.shortcuts import get_objects_for_user, assign_perm
from tinymce.widgets import TinyMCE
from django_json_widget.widgets import JSONEditorWidget
from django_jsonform.models.fields import JSONField
from urllib.parse import urlparse
from .functions import usewebsiteshortcode

# Range of possible geographical geometries

class GeometryTypes(models.TextChoices):
    GEOMETRY_INTERNAL       = "internal", "Internal"
    GEOMETRY_INSPIRE        = "inspire", "Inspire"
    GEOMETRY_COUNTY         = "county", "County"
    GEOMETRY_COUNTRY        = "country", "Country"
    GEOMETRY_NATIONALPARK   = "nationalpark", "National Park"

class PropertyTypes(models.IntegerChoices):
    PROPERTY_ENTITYTYPE     = 0, 'Farm Type'
    PROPERTY_ACTION         = 1, 'Regenerative Action'
    PROPERTY_AFFILIATION    = 2, 'Affiliation'
    PROPERTY_CUSTOMER       = 3, 'Customer'

class EntitySourceType(models.IntegerChoices):
    ENTITYSOURCE_INTERNAL   = 0, 'Internal'
    ENTITYSOURCE_OSM        = 1, 'Open Street Map'
    ENTITYSOURCE_GOVERNMENT = 2, 'Government'
    ENTITYSOURCE_NGO        = 3, 'Non-Governmental Organisation'
    
class EditTypes(models.IntegerChoices):
    EDIT_DRAFT          = 0, 'Draft'
    EDIT_PUBLISH        = 1, 'Publish'
    EDIT_REVIEWED       = 2, 'Reviewed'
    EDIT_LIVE           = 3, 'Live'

class UserEditTypes(models.IntegerChoices):
    EDIT_DRAFT          = 0, 'Draft'
    EDIT_PUBLISH        = 1, 'Publish'

class ExportQueueTypes(models.IntegerChoices):
    EXPORTQUEUE_ENTITY  = 0, 'Entities'

class FundingPeriodTypes(models.IntegerChoices):
    FUNDINGPERIOD_ANNUAL    = 0, 'Annual',
    FUNDINGPERIOD_PERVISIT  = 1, 'Per visit'

class FundingTypeTypes(models.IntegerChoices):
    FUNDINGTYPE_MAIN        = 0, 'Main payment',
    FUNDINGTYPE_SUPPLEMENT  = 1, 'Supplement payment'

class FundingSubtypeTypes(models.IntegerChoices):
    FUNDINGSUBTYPE_SFI      = 0, 'Sustainable Farming Incentive',
    FUNDINGSUBTYPE_CS       = 1, 'Countryside Stewardship'

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email_is_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return 'Profile for username "{username}"'.format(username=self.user.username)

@receiver(post_save, sender=User)
def update_user_profile(sender, instance, created, **kwargs):
    if instance.is_superuser is False:
        if created:
            Profile.objects.create(user=instance)
        instance.profile.save()
    
class Postcode(models.Model):
    """
    Stores all postcodes
    """

    code = models.CharField(max_length=8)
    location = models.PointField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['code', ])
        ]

    def __str__(self):
        return self.code
    
class PostcodeAdmin(OSMGeoAdmin):
    """
    Admin class for managing postcodes through admin interface
    """
    search_fields = (
        'code',
    )

class Location(models.Model):
    """
    Stores location lookup for when user queries on specific location
    """
    shortcode = models.CharField(max_length=100)
    scale = models.FloatField(max_length=100, default=0)
    town = models.CharField(max_length=100)
    county = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    population = models.CharField(max_length=100)
    latitude = models.CharField(max_length=100)
    longitude = models.CharField(max_length=100)
    url = models.CharField(max_length=100)
    location = models.PointField(null=True, blank=True)

    class Meta:
        ordering = ('county', 'town') 
        indexes = [
            models.Index(fields=['shortcode',]),
            models.Index(fields=['town',]),
        ]

    def __str__(self):
        return self.town + ", " + self.county

@receiver(pre_save, sender=Location)
def update_location(sender, instance, *args, **kwargs):
    """
    Whenever location is updated, update its GIS 'location' field baed on long/lat values
    """
    if (instance.longitude != '') and (instance.latitude != ''):
        instance.location = Point(float(instance.longitude), float(instance.latitude))

class LocationAdmin(OSMGeoAdmin):
    """
    Admin class for managing locations through admin interface
    """
    search_fields = (
        'town',
        'county',
        'shortcode',
    )

class Context(models.Model):
    """
    Stores geographical areas, eg counties, to allow geography-specific views
    """
    type = models.CharField(max_length = 200, choices=GeometryTypes.choices)
    name = models.CharField(max_length = 200, blank=True)
    shortcode = models.CharField(max_length = 200)
    code = models.CharField(max_length = 200, blank=True)
    # geometry = models.MultiPolygonField(null=True, blank=True)
    geometry = models.GeometryField(null=True, blank=True)
    
    def _get_geometry(self):
        return self.geometry

    geom = property(_get_geometry)
    
    class Meta:
        ordering = ('name',) 
        indexes = [
            models.Index(fields=['type',]),
            models.Index(fields=['code',]),
            models.Index(fields=['geometry',]),
        ]

    def __str__(self):
        return self.type.capitalize() + " - " + self.name

class ContextAdmin(OSMGeoAdmin):
    """
    Admin class for managing geographical contexts through admin interface
    """
    list_display = ['name', 'type', 'code']

    search_fields = (
        'name',
        'type',
        'code'
    )

class GeometryCode(models.Model):
    """
    Stores related geometry codes for entities
    """
    code = models.CharField(max_length = 200)

    def __str__(self):
        return self.code

    class Meta:
        ordering = ('code', ) 
        indexes = [
            models.Index(fields=['code',]),
        ]

class Property(models.Model):
    """
    Stores properties that belong to entities
    """

    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=100)
    type = models.IntegerField(default=0, choices=PropertyTypes.choices)
    link = models.CharField(max_length=1000, blank=True)

    class Meta:
        ordering = ('type', 'name' ) 
        indexes = [
            models.Index(fields=['name',]),
        ]

    def __str__(self):
        return self.name

class PropertyAdmin(admin.ModelAdmin):
    list_display = ['type', 'name', 'icon', 'link']

    list_filter = (
        'type',
    )

    search_fields = (
        'name',
        'type',
        'icon'
    )


class ExportQueue(models.Model):
    """
    Tracks status of vector map exports
    """
    type = models.IntegerField(default=0, choices=ExportQueueTypes.choices)
    exportdue = models.BooleanField(null=True, verbose_name="Export due")
    exported = models.DateTimeField(null=True, blank=True)
    shelloutput = models.TextField(blank=True)

    class Meta:
        ordering = ('-exportdue', '-exported' ) 
        indexes = [
            models.Index(fields=['type', 'exportdue', 'exported']),
        ]

    def __str__(self):
        return ExportQueueTypes.choices[self.type][1]
    
class ExportQueueAdmin(admin.ModelAdmin):
    list_display = ['type', 'exportdue', 'exported']

    list_filter = (
        'type',
        'exportdue'
    )

class Entity(models.Model):
    """
    Stores entities within map system
    """

    ITEMS_SCHEMA = {
        'type': 'list',
        'items': {
            'type': 'dict',
            'keys': {
                'name': {
                    'type': 'string',
                    'default': 'Title of dataset'
                },
                'type': {
                    'type': 'string',
                    'choices': [
                        {'title': 'Bar chart', 'value': 'bar'},
                        {'title': 'Pie chart', 'value': 'pie'},
                    ],
                    'default': 'bar'
                },
                'units': {
                    'type': 'string'
                },
                'values': {
                    'type': 'dict',
                    'keys': {
                    },
                    'additionalProperties': True
                }
            }
        }        
    }

    status = models.IntegerField(default=0, choices=EditTypes.choices)
    source = models.IntegerField(default=0, choices=EntitySourceType.choices)
    name = models.CharField(max_length=255)
    email = models.CharField(max_length=255, blank=True)
    external_id = models.CharField(max_length=255, blank=True)
    featured = models.BooleanField(default=False, blank=True)
    img = models.CharField(max_length=1000, blank=True)
    address = models.TextField(blank=True)
    postcode = models.CharField(max_length=255, blank=True)
    location = models.PointField(null=True, blank=True)
    desc = models.TextField(blank=True, verbose_name='Description')
    website = models.CharField(max_length=1000, blank=True)
    properties = models.ManyToManyField(Property, related_name="properties", blank=True)
    extraproperties = models.TextField(blank=True, null=True, verbose_name="Extra properties")
    geometrycodes = models.ManyToManyField(GeometryCode, related_name="geometrycodes", blank=True)
    centre = models.PointField(null=True, blank=True)
    bbox = models.GeometryField(null=True, blank=True)
    # data = models.JSONField(blank=True, default=list)
    data = JSONField(schema=ITEMS_SCHEMA, null=True, blank=True, verbose_name="Datasets")

    class Meta:
        ordering = ('id', ) 
        indexes = [
            models.Index(fields=['name', 'status', 'source', 'external_id', 'location', 'centre']),
        ]
        verbose_name = "Entity"
        verbose_name_plural = "Entities"
    
    def __str__(self):
        return self.name
    
@receiver(pre_save, sender=Entity)
def update_entity(sender, instance, *args, **kwargs):
    """
    Whenever entity is saved, update its external_id if blank using name or website 
    and also update its location
    """
    instance.external_id = instance.external_id.strip()
    instance.website = instance.website.strip()
    if instance.website != '':
        if instance.website.startswith(('http://', 'https://')) is False:
            instance.website = 'https://' + instance.website

    if instance.external_id == '':
        shortcode = re.sub("[^0-9a-zA-Z]+", "", instance.name).lower()
        if usewebsiteshortcode(instance.website):
            shortcode = urlparse(instance.website).netloc
        instance.external_id = shortcode

    if instance.postcode != '':
        postcode = Postcode.objects.filter(code=instance.postcode).first()
        if postcode is not None:
            instance.location = postcode.location

    if instance.centre is None:
        instance.centre = instance.location

@receiver(post_save, sender=Entity)
def entity_post_save(sender, **kwargs):
    """
    Adds permissions to saved entity
    """

    instance = kwargs["instance"]
    # If status of entity is 'live', put vector map export request in queue
    if instance.status == EditTypes.EDIT_LIVE:
        queue = ExportQueue.objects.filter(type=ExportQueueTypes.EXPORTQUEUE_ENTITY, exportdue=True).first()
        if queue is None:
            ExportQueue(type=ExportQueueTypes.EXPORTQUEUE_ENTITY, exportdue=True).save()

    # Add permissions to entity
    if hasattr(instance, 'user'):
        if instance.user.is_superuser is False:
            assign_perm("change_entity", instance.user, instance)
            assign_perm("delete_entity", instance.user, instance)
            assign_perm("view_entity", instance.user, instance)
            assign_perm("add_entity", instance.user, instance)

@receiver(pre_delete, sender=Entity)
def delete_entity(sender, instance, *args, **kwargs):
    """
    Whenever entity is deleted, remove any internal geometrycodes    
    """
    geometrycodes = list(Entity.objects.filter(pk=instance.id).values_list('geometrycodes__id', flat=True))
    GeometryCode.objects.filter(pk__in=geometrycodes, code__startswith="INTERNAL:").delete()

class Plan(models.Model):
    """
    Stores plans within map system
    """
    name = models.CharField(max_length = 200)
    entity = models.ForeignKey(Entity, on_delete=models.SET_NULL, \
                               null=True, blank=True, limit_choices_to={"source": EntitySourceType.ENTITYSOURCE_INTERNAL},)
    public = models.BooleanField(default=False, blank=True)
    data = models.TextField(null=True, blank=True, default="{}")

class PlanAdmin(GuardedModelAdmin):
    """
    Admin class for managing plan objects through admin interface
    """
    list_display = ['name', 'entity', 'public']

class Funding(models.Model):
    """
    Stores information about funding options, eg. SFI
    """

    period = models.IntegerField(default=0, choices=FundingPeriodTypes.choices)
    type = models.IntegerField(default=0, choices=FundingTypeTypes.choices)
    subtype = models.IntegerField(default=0, choices=FundingSubtypeTypes.choices)
    area = models.CharField(default='', max_length=255)
    code = models.CharField(default='', max_length=50)
    description = models.CharField(default='', max_length=255)
    peragreement = models.FloatField(default=0.0)
    peryear = models.FloatField(default=0.0)
    perplot = models.FloatField(default=0.0)
    perhectare = models.FloatField(default=0.0)
    permetre = models.FloatField(default=0.0)
    peritem = models.FloatField(default=0.0)
    extra = models.TextField(default='')
    
class FundingAdmin(admin.ModelAdmin):
    list_display = ['period', 'type', 'subtype', 'area', 'code', 'description', 'peragreement', 'peryear', 'perplot', 'perhectare', 'permetre', 'peritem', 'extra']

    search_fields = (
        'area',
        'code',
        'description'
    )

class Geometry(models.Model):
    """
    Stores geographical geometries, eg. LAU1, MSOA, IG, LSOA, DZ polygons
    Uses zoom-specific resolutions to minimise download size to user
    """
    type = models.CharField(max_length = 200, choices=GeometryTypes.choices)
    name = models.CharField(max_length = 200)
    code = models.CharField(max_length = 200)
    zoom = models.IntegerField(default = 0)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, null=True, blank=True)
    contexts = models.ManyToManyField(Context, related_name="contexts", blank=True)
    geometry = models.GeometryField(null=True, blank=True)

    def _get_geometry(self):
        return self.geometry

    geom = property(_get_geometry)
    
    class Meta:
        indexes = [
            models.Index(fields=['type',]),
            models.Index(fields=['code',]),
            models.Index(fields=['zoom']),
            models.Index(fields=['geometry',]),
        ]

class GeometryAdmin(OSMGeoAdmin):
    """
    Admin class for managing geometries through admin interface
    """
    list_display = ['name', 'type', 'code', 'zoom']
    list_filter = ['type']

    search_fields = (
        'name',
        'type',
        'code'
    )
        
class Post(models.Model):
    """
    Stores content posts within system
    """

    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, verbose_name='Farm')
    title = models.CharField(max_length=255)
    text = models.TextField()
    date = models.DateTimeField(auto_now=True)

class PostAdminInline(admin.TabularInline):
    model = Post
    formfield_overrides = {
        models.TextField: {'widget': TinyMCE()}
    }    

class GeometryAdminInline(admin.TabularInline):
    model = Geometry

@receiver(post_save, sender=Post)
def post_post_save(sender, **kwargs):
    """
    Adds permissions to saved post
    """

    instance = kwargs["instance"]
    if hasattr(instance, 'user'):
        assign_perm("change_post", instance.user, instance)
        assign_perm("delete_post", instance.user, instance)
        assign_perm("view_post", instance.user, instance)
        assign_perm("add_post", instance.user, instance)

class PostAdmin(GuardedModelAdmin):
    """
    Admin class for managing post objects through admin interface
    """

    list_display = ['entity', 'title', 'date']

    formfield_overrides = {
        models.TextField: {'widget': TinyMCE()}
    }  

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "entity":
            kwargs["queryset"] = get_objects_for_user(request.user, ['backend.view_entity'], Entity.objects.all())
        return super(PostAdmin, self).formfield_for_foreignkey(db_field, request, **kwargs)      
    
    def save_model(self, request, obj, form, change):
        obj.user = request.user
        super().save_model(request, obj, form, change)

    def has_module_permission(self, request):
        if super().has_module_permission(request):
            return True
        return self.get_model_objs(request).exists()
    
    def get_model_objs(self, request, action=None, klass=None):
        opts = self.opts
        actions = [action] if action else ['view', 'change', 'delete']
        klass = klass if klass else opts.model
        model_name = klass._meta.model_name
        return get_objects_for_user(user=request.user, perms=[f'{perm}_{model_name}' for perm in actions],
                                    klass=klass, any_perm=True)
        
    def get_list_display(self, request):
        fields = ['title', 'date']
        if request.user.is_superuser:
            fields = ['entity','title','text', 'date']
        return fields
    
    def get_fields(self, request, obj=None):
        fields = ['entity','title','text']
        if request.user.is_superuser:
            fields = ['entity','title','text']
        return fields
            
    def get_queryset(self, request):
        qs = super(PostAdmin, self).get_queryset(request)
        # Check global permission
        if super(PostAdmin, self).has_change_permission(request) \
            or (not self.list_editable and self.has_view_permission(request)):
                return qs
        # No global, filter by row-level permissions. also use view permission if the changelist is not editable
        if self.list_editable:
            return get_objects_for_user(request.user, [self.get_change_permission()], qs)
        else:
            return get_objects_for_user(request.user, [self.get_change_permission(), \
                                                       self.get_view_permission()], qs, any_perm=True)

    def has_change_permission(self, request, obj=None):
        if super(PostAdmin, self).has_change_permission(request, obj):
            return True
        if obj is None:
            # Here check global 'view' permission or if there is any changeable items
            return self.has_view_permission(request) or self.get_queryset(request).exists()
        else:
            # Row-level checking
            return request.user.has_perm(self.get_change_permission(), obj)

    def get_add_permission(self):
        return 'add_%s' % self.opts.object_name.lower()

    def get_view_permission(self):
        return 'view_%s' % self.opts.object_name.lower()

    def get_change_permission(self):
        return 'change_%s' % self.opts.object_name.lower()

    def get_delete_permission(self):
        return 'delete_%s' % self.opts.object_name.lower()

    def has_view_permission(self, request, obj=None):
        return request.user.has_perm(self.opts.app_label + '.' + self.get_view_permission(), obj)

    def has_delete_permission(self, request, obj=None):
        return super(PostAdmin, self).has_delete_permission(request, obj) \
                or (obj is not None and request.user.has_perm(self.get_delete_permission(), obj))


class EntityAdminForm(forms.ModelForm):

    class Meta:
        model = Entity
        widgets = {
        'desc': TinyMCE(),
        }
        fields = '__all__'
        # multiselect = forms.MultipleChoiceField(choices=SOME_CHOICES, widget=forms.CheckboxSelectMultiple())


class EntityAdmin(GuardedModelAdmin, OSMGeoAdmin):
    """
    Admin class for managing entity objects through admin interface
    """

    form = EntityAdminForm
    list_filter = ['status', 'source']
    search_fields = (
        'name',
        'external_id',
        'email',
        'address',
        'postcode',
        'website'
    )

    def save_model(self, request, obj, form, change):
        obj.user = request.user
        super().save_model(request, obj, form, change)

    def has_module_permission(self, request):
        if super().has_module_permission(request):
            return True
        return self.get_model_objs(request).exists()
    
    def get_model_objs(self, request, action=None, klass=None):
        opts = self.opts
        actions = [action] if action else ['view', 'change', 'delete']
        klass = klass if klass else opts.model
        model_name = klass._meta.model_name
        return get_objects_for_user(user=request.user, perms=[f'{perm}_{model_name}' for perm in actions],
                                    klass=klass, any_perm=True)
        
    def get_list_display(self, request):
        fields = ['name', 'website']
        if request.user.is_superuser:
            fields = ['status', 'source', 'name', 'external_id', 'featured', 'website']
        return fields
    
    def get_fields(self, request, obj=None):
        fields = ['name','email', 'address', 'postcode', 'location', 'website', 'desc', 'properties', 'data']
        if request.user.is_superuser:
            fields = ['status', 'source', 'name', 'email', 'external_id', 'featured', 'properties', 'extraproperties', 'img', 'website', 'address', 'postcode', 'location', 'geometrycodes', 'centre', 'bbox', 'desc', 'data']
        return fields
    
    def get_inlines(self, request, obj=None):
        inlines = ()
        if request.user.is_superuser:
            inlines = (PostAdminInline, )
        return inlines
        
    def get_queryset(self, request):
        qs = super(EntityAdmin, self).get_queryset(request)
        # Check global permission
        if super(EntityAdmin, self).has_change_permission(request) \
            or (not self.list_editable and self.has_view_permission(request)):
                return qs
        # No global, filter by row-level permissions. also use view permission if the changelist is not editable
        if self.list_editable:
            return get_objects_for_user(request.user, [self.get_change_permission()], qs)
        else:
            return get_objects_for_user(request.user, [self.get_change_permission(), \
                                                       self.get_view_permission()], qs, any_perm=True)

    def has_change_permission(self, request, obj=None):
        if super(EntityAdmin, self).has_change_permission(request, obj):
            return True
        if obj is None:
            # Here check global 'view' permission or if there is any changeable items
            return self.has_view_permission(request) or self.get_queryset(request).exists()
        else:
            # Row-level checking
            return request.user.has_perm(self.get_change_permission(), obj)

    def get_add_permission(self):
        return 'add_%s' % self.opts.object_name.lower()

    def get_view_permission(self):
        return 'view_%s' % self.opts.object_name.lower()

    def get_change_permission(self):
        return 'change_%s' % self.opts.object_name.lower()

    def get_delete_permission(self):
        return 'delete_%s' % self.opts.object_name.lower()

    def has_view_permission(self, request, obj=None):
        return request.user.has_perm(self.opts.app_label + '.' + self.get_view_permission(), obj)

    def has_delete_permission(self, request, obj=None):
        return super(EntityAdmin, self).has_delete_permission(request, obj) \
                or (obj is not None and request.user.has_perm(self.get_delete_permission(), obj))
    
    def __str__(self):
        return self.name

class Message(models.Model):
    """
    Stores all emails that are sent - for possible use violations
    """
    entity = models.ForeignKey(Entity, on_delete=models.DO_NOTHING, null=True, blank=True)
    name = models.TextField(blank=True)
    email_from = models.CharField(max_length=100, blank=True)
    email_to = models.CharField(max_length=100, blank=True)
    message = models.TextField(blank=True)
    date = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('date', 'email_from', 'email_to' ) 
        indexes = [
            models.Index(fields=['email_from', 'email_to', ]),
        ]
    
    def __str__(self):
        return self.name

class MessageAdmin(admin.ModelAdmin):
    list_display = ['entity', 'name', 'email_from', 'email_to', 'date']

    search_fields = (
        'name',
        'email_from',
        'email_to'
    )
