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

// export const POSITIVE_DEFAULT = "positivefarms.org";
export const POSITIVE_DEFAULT = "positiveplaces.org";

// Array of possible sites
export const POSITIVE_SITES = {
    "positiveplaces.org": {name: "Positive Places", shortcode: "positiveplaces"},
    "positivefarms.org": {name: "Positive Farms", shortcode: "positivefarms"}
};

// Get current domain
const domain = window.location.host.split(":")[0];
const domainelements = domain.split(".");
export const BASEDOMAIN = domainelements[domainelements.length - 2] + "." + domainelements[domainelements.length - 1];

// Determine site details based on domain
export const POSITIVE_SITE = (BASEDOMAIN in POSITIVE_SITES) ? POSITIVE_SITES[BASEDOMAIN] : POSITIVE_SITES[POSITIVE_DEFAULT];

// URL of backend system
export const API_URL = isDev() ? "http://localhost:80" : "";
// export const API_URL = isDev() ? "http://192.168.1.29:80" : "";

// Base url of tile server
export const TILESERVER_BASEURL = isDev() ? "http://localhost:8080" : ("https://tiles." + POSITIVE_SITE.shortcode + '.org');

// Base url of main website
export const DOMAIN_BASEURL = isDev() ? "http://localhost" : ("https://" + POSITIVE_SITE.shortcode + '.org');

// Height of wind turbine in metres in order to calculate bounding box for wind turbine points
export const WINDTURBINE_HEIGHT = 160;

// Number of milliseconds to stay at each entity during flying tour
export const FLYINGTOUR_LINGERTIME = 25000;

// Planning constraints
export const PLANNING_CONSTRAINTS = {
    "wind": 
    {
        "description": "Inadequate wind",
        "colour": "blue",
        "layers":
        [
            "constraint_wind_fill_colour"
        ]
    },
    "landscape": 
    {
        "description": "Landscape / visual impact",
        "colour": "chartreuse",
        "layers": 
        [
            "constraint_landscape_and_visual_impact_fill_colour",
            "constraint_landscape_and_visual_impact_fill_pattern"
        ]
    },
    "heritage":
    {
        "description": "Heritage impact",
        "colour": "darkgoldenrod",
        "layers": 
        [
            "constraint_heritage_impacts_fill_colour",
            "constraint_heritage_impacts_fill_pattern"
        ]
    },
    "residential":
    {
        "description": "Too close to residential",
        "colour": "darkorange",
        "layers":
        [
            "constraint_separation_distance_to_residential_fill_colour",
            "constraint_separation_distance_to_residential_fill_pattern"
        ]
    },
    "ecology":
    {
        "description": "Ecology / wildlife",
        "colour": "darkgreen",
        "layers":
        [
            "constraint_ecology_and_wildlife_fill_colour",
            "constraint_ecology_and_wildlife_fill_pattern"
        ]
    },
    "aviation_mod":
    {
        "description": "Aviation / MOD",
        "colour": "purple",
        "layers": 
        [
            "constraint_aviation_and_exclusion_areas_fill_colour",
            "constraint_aviation_and_exclusion_areas_fill_pattern"
        ]    
    },
    "safety":
    {
        "description": "Unsafe distance (transportation, powerlines, etc)",
        "colour": "red",
        "layers": 
        [
            "constraint_other_technical_constraints_lo_fill_colour",
            "constraint_other_technical_constraints_lo_fill_pattern",
            "constraint_other_technical_constraints_hi_fill_colour",
            "constraint_other_technical_constraints_hi_fill_pattern"
        ]
    }
};

// Default year start
export const periodstart = 2010; 

// Default year end
export const periodend = 2018; 

// Default number of graphs to display across width
export const areascale = 1; 

// Default latitude
export const DEFAULT_LAT = 53.9908; 

// Default longitude
export const DEFAULT_LNG = -3.8231; 

// Default zoom scale
export const DEFAULT_ZOOM = 5; 

// Default pitch
export const DEFAULT_PITCH = 26;

// Default bearing
export const DEFAULT_BEARING = 0;

// Default maxbounds 

export const DEFAULT_MAXBOUNDS = [
    [
        -22.4,
        49.5
    ],
    [
        13.3, 
        61.2 
    ]
]

// Zoom level at which to reveal 'Level 2' geographies, ie. MSOA/IG
export const ZOOM_SHOWLEVEL_2 = 20; 

// Zoom level at which to reveal 'Level 3' geographies, ie. LSOA/DZ
export const ZOOM_SHOWLEVEL_3 = 20; 

// Padding to deal with desktop drawer getting in way
export const DESKTOP_PADDING = {top: 20, bottom: 20, left: 20, right: 320};

// Padding to deal with general mobile spacing
export const MOBILE_PADDING = {top: 80, bottom: 120, left: 20, right: 20};

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