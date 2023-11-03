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

// Height of wind turbine in metres in order to calculate bounding box for wind turbine points
export const WINDTURBINE_HEIGHT = 150;

// Number of milliseconds to stay at each entity during flying tour
export const FLYINGTOUR_LINGERTIME = 25000;

// Planning constraints
export const PLANNING_CONSTRAINTS = {
    "Inadequate wind": 
    {
        "colour": "blue",
        "layers":
        [
            "constraint_windspeed_fill_colour",
            "constraint_windspeed_fill_pattern",
        ]
    },
    "Landscape / visual impact": 
    {
        "colour": "chartreuse",
        "layers": 
        [
            "constraint_nationalpark_fill_colour",
            "constraint_nationalpark_fill_pattern",
            "constraint_aonb_fill_colour",
            "constraint_aonb_fill_pattern",
            "constraint_heritagecoasts_fill_colour",
            "constraint_heritagecoasts_fill_pattern"
        ]
    },
    "Heritage impact":
    {
        "colour": "darkgoldenrod",
        "layers": 
        [
            "constraint_listedbuildings_fill_colour",
            "constraint_listedbuildings_fill_pattern",
            "constraint_conservationareas_fill_colour",
            "constraint_conservationareas_fill_pattern",
            "constraint_worldheritagesites_fill_colour",
            "constraint_worldheritagesites_fill_pattern",
            "constraint_scheduledancientmonuments_fill_colour",
            "constraint_scheduledancientmonuments_fill_pattern",
            "constraint_registeredparksgardens_fill_colour",
            "constraint_registeredparksgardens_fill_pattern",
            "constraint_historicbattlefields_fill_colour",
            "constraint_historicbattlefields_fill_pattern"
        ]
    },
    "Too close to residential":
    {
        "colour": "darkorange",
        "layers":
        [
            "constraint_separationresidential_fill_colour",
            "constraint_separationresidential_fill_pattern",
            "constraint_separationresidential_buffer_line_colour",
            "constraint_separationresidential_buffer_line_pattern"
        ]
    },
    "Ecology / wildlife":
    {
        "colour": "darkgreen",
        "layers":
        [
            "constraint_sssi_fill_colour",
            "constraint_sssi_fill_pattern",
            "constraint_ramsar_fill_colour",
            "constraint_ramsar_fill_pattern",
            "constraint_sac_fill_colour",
            "constraint_sac_fill_pattern",
            "constraint_spa_fill_colour",
            "constraint_spa_fill_pattern",
            "constraint_nnr_fill_colour",
            "constraint_nnr_fill_pattern",
            "constraint_ancientwoodland_fill_colour",
            "constraint_ancientwoodland_fill_pattern",
            "constraint_localwildlifereserve_fill_colour",
            "constraint_localwildlifereserve_fill_pattern",
            "constraint_hedgerows_fill_colour",
            "constraint_hedgerows_fill_pattern",
            "constraint_hedgerows_buffer_line_colour",
            "constraint_hedgerows_buffer_line_pattern"
        ]
    },
    "Unsafe distance (transportation, powerlines, etc)":
    {
        "colour": "red",
        "layers": 
        [
            "constraint_roads_fill_colour",
            "constraint_roads_fill_pattern",
            "constraint_roads_buffer_line_colour",
            "constraint_roads_buffer_line_pattern",
            "constraint_railwaylines_fill_colour",
            "constraint_railwaylines_fill_pattern",
            "constraint_railwaylines_buffer_line_colour",
            "constraint_railwaylines_buffer_line_pattern",
            "constraint_inlandwaters_fill_colour",
            "constraint_inlandwaters_fill_pattern",
            "constraint_inlandwaters_buffer_line_colour",
            "constraint_inlandwaters_buffer_line_pattern",
            "constraint_pipelines_fill_colour",
            "constraint_pipelines_fill_pattern",
            "constraint_pipelines_buffer_line_colour",
            "constraint_pipelines_buffer_line_pattern",
            "constraint_powerlines_fill_colour",
            "constraint_powerlines_fill_pattern",
            "constraint_powerlines_buffer_line_colour",
            "constraint_powerlines_buffer_line_pattern",
            "constraint_footpaths_fill_colour",
            "constraint_footpaths_fill_pattern",
            "constraint_footpaths_buffer_line_colour",
            "constraint_footpaths_buffer_line_pattern",
            "constraint_bridleways_fill_colour",
            "constraint_bridleways_fill_pattern",
            "constraint_bridleways_buffer_line_colour",
            "constraint_bridleways_buffer_line_pattern"        
        ]
    },
    "Aviation / MOD":
    {
        "colour": "purple",
        "layers": 
        [
            "constraint_flightpaths_fill_colour",
            "constraint_flightpaths_fill_pattern",
            "constraint_flightpaths_buffer_line_colour",
            "constraint_flightpaths_buffer_line_pattern",        
            "constraint_civilianairports_fill_colour",
            "constraint_civilianairports_fill_pattern",
            "constraint_civilianairports_buffer_line_colour",
            "constraint_civilianairports_buffer_line_pattern",        
            "constraint_aerodromes_fill_colour",
            "constraint_aerodromes_fill_pattern",
            "constraint_aerodromes_buffer_line_colour",
            "constraint_aerodromes_buffer_line_pattern",        
            "constraint_modairports_fill_colour",
            "constraint_modairports_fill_pattern",
            "constraint_modairports_buffer_line_colour",
            "constraint_modairports_buffer_line_pattern",        
            "constraint_modtrainingareas_fill_colour",
            "constraint_modtrainingareas_fill_pattern",
            "constraint_modtrainingareas_buffer_line_colour",
            "constraint_modtrainingareas_buffer_line_pattern",        
            "constraint_explosivesafeguardedareas_fill_colour",
            "constraint_explosivesafeguardedareas_fill_pattern",
            "constraint_explosivesafeguardedareas_buffer_line_colour",
            "constraint_explosivesafeguardedareas_buffer_line_pattern",        
            "constraint_dangerareasnearranges_fill_colour",
            "constraint_dangerareasnearranges_fill_pattern",
            "constraint_dangerareasnearranges_buffer_line_colour",
            "constraint_dangerareasnearranges_buffer_line_pattern",        
            "constraint_modexclusionareas_fill_colour",
            "constraint_modexclusionareas_fill_pattern",
            "constraint_modexclusionareas_buffer_line_colour",
            "constraint_modexclusionareas_buffer_line_pattern"        
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