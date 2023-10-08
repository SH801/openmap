"""carbonmap URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))

carbonmap/urls.py
Manages URL routing for application
"""

from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path, include, re_path
from rest_framework.urlpatterns import format_suffix_patterns

from .settings import STATIC_ROOT
from backend import views
from backend import endpoints

admin.site.site_header  =  "Future Farms"  
admin.site.site_title  =  "Future Farms Administration Site"
admin.site.index_title  =  "Administration Site"

urlpatterns = [
    path('accounts/logout/', auth_views.LogoutView.as_view(next_page='/accounts/login/'), name='logout'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('account/', views.account, name='account'),
    path('account/entities/', views.accountentities, name='accountentities'),
    path('account/entity/<id>', views.accountentity, name='accountentity'),
    path('account/plan/<id>', views.accountplan, name='accountplan'),
    path('account/plan/save/', views.accountplansave, name='accountplansave'),
    path('signup/', views.signup, name='signup'),
    path('email_sent/', views.email_sent, name='email_sent'),
    path('email_confirmed/', views.email_confirmed, name='email_confirmed'),
    path('email_not_confirmed/', views.email_not_confirmed, name='email_not_confirmed'),
    re_path(r'^confirm_email/(?P<uidb64>[0-9A-Za-z_\-]+)/(?P<token>[0-9A-Za-z]{1,13}-[0-9A-Za-z]{1,50})/$', views.confirm_email, name='confirm_email'),
    path('deactivate/', views.deactivate, name='deactivate'),
    path('deactivate_confirm/', views.deactivate_confirm, name='deactivate_confirm'),
    re_path(r'^farm/(?P<farmid>[\w\-]+)$', views.farm, name='farm'),
    re_path(r'^post/(?P<postid>[\w\-]+)$', views.post, name='post'),
    re_path(r'^delete/(?P<type>(farm|post|plan))/(?P<id>[\w\-]+)$', views.delete, name='delete'),
    path('admin/', admin.site.urls),
    path('api/', include(endpoints)),
    path('api/auth/', include('knox.urls')),
    path('geometries/', views.Geometries, name='geometries'),
    path('search/', views.Search, name='search'),
    path('entities/', views.Entities, name='entities'),
    path('properties/', views.Properties, name='properties'),
    path('context/<context_shortcode>', views.GetContext, name='context'),
    path('externalref/<externalref>', views.ExternalRef, name='externalref'),
    path('externalref/<externalref>/', views.ExternalRef, name='externalref'),
    path('export/<exportid>', views.Export, name='export'),
    path('lastexport/', views.LastExport, name='lastexport'),
    path('message/', views.SendMessage, name='sendmessage'),
    path('geometrybounds/', views.GeometryBounds, name='geometrybounds'),
    path('locationposition', views.LocationPosition, name='locationposition'),
    path('organisations/', views.Organisations.as_view()),
    re_path(r'^organisations/(?P<shortcode>[\w\-\.]*)(/*)$', views.SingleOrganisation.as_view()),
    re_path(r'.*', views.home, name='home'),                                       
]

urlpatterns = format_suffix_patterns(urlpatterns)
