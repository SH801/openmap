from django.conf.urls import include, url
from rest_framework import routers

from .api import RegistrationAPI, LoginAPI, UserAPI, EntityAPI

urlpatterns = [
    url("^entity/$", EntityAPI.as_view()),
    url("^auth/register/$", RegistrationAPI.as_view()),
    url("^auth/login/$", LoginAPI.as_view()),
    url("^auth/user/$", UserAPI.as_view()),
]
