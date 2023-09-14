import os

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Entity

class OrganisationSerializer(serializers.ModelSerializer):
    """
    Custom serializer for Organisation object
    """
    
    id = serializers.CharField(source='external_id', required=False)
    detail = serializers.SerializerMethodField()
    map = serializers.SerializerMethodField()

    def get_detail(self, obj):
        return os.environ.get("PUBLICDOMAIN") + 'organisations/' + obj.external_id

    def get_map(self, obj):
        return os.environ.get("PUBLICDOMAIN") + obj.external_id

    class Meta:
        model = Entity
        fields = ['id', 'name', 'detail', 'map']

class CreateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(validated_data['username'],
                                        None,
                                        validated_data['password'])
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username')

class LoginUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Unable to log in with provided credentials.")        
    
class EntitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entity
        fields = ('id', 'name')
