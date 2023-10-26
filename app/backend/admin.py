"""
Copyright (c) Positive Farms, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/admin.py
Register forms for Django admin interface
"""

from django.contrib import admin
from .models import Profile
from .models import Context, ContextAdmin
from .models import Location, LocationAdmin
from .models import Geometry, GeometryAdmin 
from .models import GeometryCode
from .models import Property, PropertyAdmin
from .models import Entity, EntityAdmin
from .models import Plan, PlanAdmin
from .models import Post, PostAdmin
from .models import Message, MessageAdmin
from .models import ExportQueue, ExportQueueAdmin
from .models import Postcode, PostcodeAdmin
from .models import Funding, FundingAdmin
from .models import CustomGeoJSON, CustomGeoJSONAdmin

admin.site.register(Profile)
admin.site.register(Context, ContextAdmin)
admin.site.register(Location, LocationAdmin)
admin.site.register(Geometry, GeometryAdmin)
admin.site.register(ExportQueue, ExportQueueAdmin)
admin.site.register(GeometryCode)
admin.site.register(Property, PropertyAdmin)
admin.site.register(Entity, EntityAdmin)
admin.site.register(Plan, PlanAdmin)
admin.site.register(Post, PostAdmin)
admin.site.register(Message, MessageAdmin)
admin.site.register(Postcode, PostcodeAdmin)
admin.site.register(Funding, FundingAdmin)
admin.site.register(CustomGeoJSON, CustomGeoJSONAdmin)