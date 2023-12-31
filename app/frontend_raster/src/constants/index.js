/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * constants/index.js 
 * 
 * Values for key constants
 */ 

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
console.log("Development machine", isDev());

// URL of backend system
export const API_URL = isDev() ? "http://localhost:80" : "";

// Default year start
export const periodstart = 2010; 

// Default year end
export const periodend = 2018; 

// Default number of graphs to display across width
export const areascale = 1; 

// Default latitude
export const DEFAULT_LAT = 55.69142309402058; 

// Default longitude
export const DEFAULT_LNG = -3.7832450866699223; 

// Default zoom scale
export const DEFAULT_ZOOM = 5; 

// Zoom level at which to reveal 'Level 2' geographies, ie. MSOA/IG
export const ZOOM_SHOWLEVEL_2 = 20; 

// Zoom level at which to reveal 'Level 3' geographies, ie. LSOA/DZ
export const ZOOM_SHOWLEVEL_3 = 20; 

// Padding to deal with desktop drawer getting in way
export const DESKTOP_PADDING = [300, 50];

// General padding for fitting bounds
export const FITBOUNDS_PADDING = 10;

// Padding for caching polygon data for minor changes to map position
export const MAPCACHE_PIXELPADDING = 40;

// Minimum zoom to allow selection of polygons
export const EDIT_ZOOM = 13;

// Short text for each of level geographies, 1, 2, 3
export const LEVELS = [
    'inspire',
    'inspire2',
    'inspire3',
]

// Descriptive text for each of level geographies, 1, 2, 3
export const LEVELS_DESCRIPTIVE = [
    'Inspire Level 1',
    'Inspire Level 2',
    'Inspire Level 3',
]

// Different property types
export const PROPERTY_ENTITYTYPE  = 0;
export const PROPERTY_ACTION      = 1;
export const PROPERTY_AFFILIATION = 2;
export const PROPERTY_CUSTOMER    = 3;

// New (blank) entity
export const NEW_ENTITY = {
    'name': '',
    'address': '',
    'img': '',
    'desc': '',
    'website': '',
    'data': '',
    'businesstypes': [],
    'actions': [],
    'posts': [],
    'geometrycodes': [],
}

// Color values for each of level geographies, 1, 2, 3
export const AREA_LEVEL_COLOURS = ["#4CBB17"];

// Color value for highlighted area - typical to show results of search
export const AREA_HIGHLIGHT_COLOUR = ['#4CBB17']

// Default style for GeoJSON polygon (assuming not selected)
export const AREA_STYLE_DEFAULT = {
    fillColor: '#fff', 
    fillOpacity: 0,
    weight: 1, 
    color: "#999",
    opacity: 0
};

// Default style for active polygons during editing mode - to indicate not selectable
export const AREA_STYLE_EDITING_ACTIVE_NOTSELECTABLE = {
    fillColor: '#000', 
    fillOpacity: 0.4,
    weight: 3, 
    color: "#000",
    opacity: 0
}

// Default style for GeoJSON context polygon 
export const AREA_STYLE_CONTEXT = {
    fillColor: '#fff', 
    fillOpacity: 0.1,
    weight: 3, 
    color: "#000",
    opacity: 0.2
};

// Style for GeoJSON polyon when mouse over
export const AREA_STYLE_MOUSEOVER = {
    // fillColor: AREA_LEVEL_COLOURS[0],
    // fillOpacity: 1,
    weight: 3, 
    color: "#4CBB17",
    opacity: 1,
};

// Style for GeoJSON polygon when mouse out
export const AREA_STYLE_MOUSEOUT = {
    // fillColor: '#fff',
    // fillOpacity: 0.1,
    weight: 1, 
    color: "#999",
    opacity: 0.7,
};

export * from './actionTypes';
export * from './layout';