import json

from rest_framework import viewsets, permissions, generics
from rest_framework.response import Response
from django.http import HttpResponse
from datetime import datetime, timezone
from knox.models import AuthToken

from rest_framework import serializers

from .models import Entity, GeometryCode, Property, Post
from .serializers import (CreateUserSerializer,
                          UserSerializer, 
                          LoginUserSerializer,
                          EntitySerializer)

def raiseauthenticationerror():
    res = serializers.ValidationError({'message':'Permission denied'})
    res.status_code = 403
    raise res

class LoginAPI(generics.GenericAPIView):
    serializer_class = LoginUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        _, token = AuthToken.objects.create(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token
        })

class RegistrationAPI(generics.GenericAPIView):
    serializer_class = CreateUserSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _, token = AuthToken.objects.create(user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token
        })

class UserAPI(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, ]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
    
class EntityAPI(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, ]
    serializer_class = EntitySerializer

    def post(self, request, *args, **kwargs):
        try:
            entitydata = json.loads(request.body)
        except ValueError:
            return OutputError()

        # Sanitize json field

        field_data = []
        try:
            field_data = json.loads(entitydata['data'])
        except ValueError:
            return OutputError()

        if entitydata['id'] == -1:
            entity = Entity(name='')
            entity.save()
            entitydata['id'] = entity.pk

        entity = Entity.objects.filter(pk=entitydata['id'])
        entity.update(  name=entitydata['name'], \
                        address=entitydata['address'], \
                        img=entitydata['img'], \
                        desc=entitydata['desc'], \
                        website=entitydata['website'], \
                        data=field_data)

        # Clear and add in properties
        allproperties = list(set(entitydata['businesstypes'] + entitydata['actions']))
        properties = Property.objects.filter(pk__in=allproperties)
        entity.first().properties.set(properties)

        # Add in geometrycodes creating any not already in database
        existingcodes = GeometryCode.objects.filter(code__in=entitydata['geometrycodes']).values()
        existingcodes = [code['code'] for code in existingcodes]
        missingcodes = list(set(entitydata['geometrycodes']) - set(existingcodes))
        for geometrycode in missingcodes: GeometryCode(code=geometrycode).save()
        existingcodes = GeometryCode.objects.filter(code__in=entitydata['geometrycodes'])
        entity.first().geometrycodes.set(existingcodes)

        Post.objects.filter(entity=entitydata['id']).delete()
        for post in entitydata['posts']:
            if post['date'] is None: post['date'] = datetime.now(timezone.utc)
            Post(entity=entity.first(), title=post['title'], text=post['text'], date=post['date']).save()

        return Response({
            "id": entitydata['id']
        })

    def get_object(self):
        return self.request.user
