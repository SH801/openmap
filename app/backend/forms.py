from django import forms
from django.db import models
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Entity, Post, Property, PropertyTypes, EditTypes, UserEditTypes
from localflavor.gb.forms import GBPostcodeField
from guardian.shortcuts import get_objects_for_user


class SignUpForm(UserCreationForm):
    email = forms.EmailField(max_length=254)
    organisation = forms.CharField(max_length=254, label="Name of farm")
    address = forms.CharField(widget=forms.Textarea(attrs={'rows':4}), max_length = 1000, label="Address", required=False)
    postcode = GBPostcodeField(required=False)   
    GeoJSON = forms.CharField(widget=forms.Textarea(attrs={'leafletdraw': True}), required=True)
    type = forms.ModelMultipleChoiceField(queryset=Property.objects.filter(type=PropertyTypes.PROPERTY_ENTITYTYPE).order_by('name'), label="Type of farm", required=True)
    actions = forms.ModelMultipleChoiceField(queryset=Property.objects.filter(type=PropertyTypes.PROPERTY_ACTION).order_by('name'), label="What you're doing...", required=False)
    website = forms.CharField(max_length=100, label="Website", required=False)

    class Meta:
        model = User
        fields = ('username', 'password1', 'password2', 'email', 'organisation', 'address', 'postcode', 'GeoJSON', 'type', 'actions', 'website')

    def __init__(self, *args, **kwargs):
        super(SignUpForm, self).__init__(*args, **kwargs)
        self.fields['GeoJSON'].error_messages = {'required': 'Please draw an outline of your farm on the map'}
            
    def clean_email(self):
        email = self.cleaned_data.get('email')
        username = self.cleaned_data.get('username')
        if email and User.objects.filter(email=email).exclude(
            username=username).exists():
            self.add_error('email', 'This email address has already been registered.')
            # raise forms.ValidationError('This email address has already been registered.')
        return email

class UserForm(forms.ModelForm):

    class Meta:
        model = User
        fields = ()
        # fields = ('first_name', 'last_name',)

class FarmForm(forms.ModelForm):
    status = forms.ChoiceField(required=True, initial=EditTypes.EDIT_DRAFT, choices=EditTypes.choices)
    name = forms.CharField(max_length = 200, label="Name of farm")
    email = forms.CharField(max_length = 200, label="Email for public contact - leave blank to prevent contact", required=False)
    address = forms.CharField(widget=forms.Textarea(attrs={'rows':4}), max_length = 1000, label="Address", required=False)
    postcode = GBPostcodeField(required=False)   
    location = forms.CharField(widget=forms.Textarea(attrs={'hidden': True, 'fieldname': 'field_location'}), required=False)
    GeoJSON = forms.CharField(widget=forms.Textarea(attrs={'leafletdraw': True}), required=False)
    type = forms.ModelMultipleChoiceField(queryset=Property.objects.filter(type=PropertyTypes.PROPERTY_ENTITYTYPE).order_by('name'), label="Type of farm", required=False)
    actions = forms.ModelMultipleChoiceField(queryset=Property.objects.filter(type=PropertyTypes.PROPERTY_ACTION).order_by('name'), label="What farm is doing...", required=False)
    website = forms.CharField(max_length=100, label="Website", required=False)
    desc = forms.CharField(widget=forms.Textarea(attrs={'tinymce': True, 'rows':6}), label="Description of your farm to appear on main website:", required=False)

    def __init__(self, *args, **kwargs):
        """ 
        Grants access to request object for consistency with PostForm
        """
        self.request = kwargs.pop('request')
        super(FarmForm, self).__init__(*args, **kwargs)
        if self.request.user.is_superuser is False:
            self.fields['status'].choices = UserEditTypes.choices

    class Meta:
        model = Entity
        fields = ('status', 'name', 'address', 'postcode', 'location', 'GeoJSON', 'type', 'actions', 'website', 'email', 'desc')

class PostForm(forms.ModelForm):
    entity = forms.ModelChoiceField(queryset=None, label="Farm", required=True)
    title = forms.CharField(max_length = 1000, label="Title", required=False)
    text = forms.CharField(widget=forms.Textarea(attrs={'tinymce': True, 'rows':1}), label="Content of post:", required=False)

    def __init__(self, *args, **kwargs):
        """ 
        Grants access to request object so only entities accessible to current user are given as options
        """
        self.request = kwargs.pop('request')
        super(PostForm, self).__init__(*args, **kwargs)
        self.fields['entity'].queryset = get_objects_for_user(self.request.user, ['backend.view_entity'], Entity.objects.all().order_by('name'))

    class Meta:
        model = Post
        fields = ('entity', 'title', 'text' )
