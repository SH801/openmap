from django import template
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.contrib.postgres.aggregates import ArrayAgg
from guardian.shortcuts import get_objects_for_user
from backend.models import Entity, Post, EditTypes, Property, PropertyTypes

import re
import markdown

register = template.Library()
    
@register.simple_tag
def settings_value(name):
    return getattr(settings, name, "")

@register.filter(name='range') 
def filter_range(start, end):   
    return range(start, end)

@register.filter(name='times') 
def times(number):
    return range(number)

@register.tag(name='captureas')
def do_captureas(parser, token):
    try:
        tag_name, args = token.contents.split(None, 1)
    except ValueError:
        raise template.TemplateSyntaxError("'captureas' node requires a variable name.")
    nodelist = parser.parse(('endcaptureas',))
    parser.delete_first_token()
    return CaptureasNode(nodelist, args)

class CaptureasNode(template.Node):
    def __init__(self, nodelist, varname):
        self.nodelist = nodelist
        self.varname = varname

    def render(self, context):
        output = self.nodelist.render(context)
        context[self.varname] = output
        return ''

class ExprNode(template.Node):
    def __init__(self, expr_string, var_name):
        self.expr_string = expr_string
        self.var_name = var_name
    
    def render(self, context):
        try:
            clist = list(context)
            clist.reverse()
            d = {}
            d['_'] = _
            for c in clist:
                d.update(c)
            if self.var_name:
                context[self.var_name] = eval(self.expr_string, d)
                return ''
            else:
                return str(eval(self.expr_string, d))
        except:
            raise

r_expr = re.compile(r'(.*?)\s+as\s+(\w+)', re.DOTALL)    
def do_expr(parser, token):
    try:
        tag_name, arg = token.contents.split(None, 1)
    except ValueError:
        raise (template.TemplateSyntaxError, "%r tag requires arguments" % token.contents[0])
    m = r_expr.search(arg)
    if m:
        expr_string, var_name = m.groups()
    else:
        if not arg:
            raise (template.TemplateSyntaxError, "%r tag at least require one argument" % tag_name)
            
        expr_string, var_name = arg, None
    return ExprNode(expr_string, var_name)
do_expr = register.tag('expr', do_expr)

@register.simple_tag(takes_context=True)
def get_farms(context):
    '''
    Get farms for current user
    '''

    farms = get_objects_for_user(context['request'].user, ['backend.change_entity'], Entity.objects.all().annotate(properties_list=ArrayAgg('properties')).order_by('name'))
    for farm in farms:
        farm.status = EditTypes.choices[farm.status][1]
        farm.types = Property.objects.filter(pk__in=farm.properties_list).filter(type=PropertyTypes.PROPERTY_ENTITYTYPE).order_by('name').values_list('name', flat=True)

    return {'farms': farms}

@register.simple_tag(takes_context=True)
def get_posts(context):
    '''
    Get posts for current user
    '''
    posts = get_objects_for_user(context['request'].user, ['backend.change_post'], Post.objects.all().order_by('-date'))
    for post in posts:
        post.farm = post.entity.name        
    return {'posts': posts}
