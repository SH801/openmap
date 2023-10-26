import { bbox, point, destination } from '@turf/turf';
import { WINDTURBINE_HEIGHT, POSITIVE_SITE } from "../constants";

function addContextFilter(context, filter) {
    if (context) return ["all", getContextFilter(context), filter];
    return filter;
}

function getContextFilter(context) {
    if (context) return ["in", "'" + context.id.toString() + "'", ["get", "contexts"]];
    return null;
}

export function getBoundingBox(geojson) {

    var boundingbox = bbox(geojson);

    // Go through wind turbines and extract max latitude of estimated top of wind turbine
    var maxturbinepos = null;
    for(let i = 0; i < geojson.features.length; i++) {
        if (geojson.features[i].geometry.type === 'Point') {
            var currturbinepos = geojson.features[i].geometry.coordinates;
            if (maxturbinepos === null) maxturbinepos = currturbinepos;
            else if (currturbinepos[1] > maxturbinepos[1]) maxturbinepos = currturbinepos;
        }
    }

    if (maxturbinepos) {
        var maxturbinefeature = destination(point(maxturbinepos), (WINDTURBINE_HEIGHT / 1000), 0, {units: 'kilometres'});
        maxturbinepos = maxturbinefeature.geometry.coordinates;
        // If maxturbinepos is outside bounding box, modify bounding box to include it
        if (boundingbox[3] < maxturbinepos[1]) boundingbox[3] = maxturbinepos[1];
    }

    return boundingbox;
}

export function mapReset(context, map) {
    if (POSITIVE_SITE.shortcode === "positivefarms") {
        map.setFilter('positivefarms_active', ["any"]);
        map.setFilter('positivefarms_background', getContextFilter(context));
    }
    map.setFilter('renewables_active', ["any"]);
    map.setFilter('renewables_background', getContextFilter(context));
} 

export function mapSelectEntity(context, map, entityid) {
    // We don't care about context for active entity - if user has selected it, make it active regardless
    var backgroundFilter = ["!=", entityid, ["get", "id"]];
    if (POSITIVE_SITE.shortcode === "positivefarms") {
        map.setFilter('positivefarms_active', ["==", 'id', entityid ]);
        map.setFilter('positivefarms_background', addContextFilter(context, backgroundFilter));
    }
    map.setFilter('renewables_active', ["==", 'id', entityid ]);
    map.setFilter('renewables_background', addContextFilter(context, backgroundFilter));
} 

export function mapSelectProperty(context, map, propertyid) {
    // const layer = map.getStyle().layers.find((layer) => layer.id === 'renewables_windturbine');
    // layer.layout['icon-image'] = 'windturbine_orange';
    var activeFilter = ['in', "'" + propertyid.toString() + "'", ['get', 'entityproperties']];
    var backgroundFilter = ['!', ['in', "'" + propertyid.toString() + "'", ['get', 'entityproperties']]];
    if (POSITIVE_SITE.shortcode === "positivefarms") {
        map.setFilter('positivefarms_active', addContextFilter(context, activeFilter));
        map.setFilter('positivefarms_background', addContextFilter(context, backgroundFilter));
    }
    map.setFilter('renewables_active', addContextFilter(context, activeFilter));
    map.setFilter('renewables_background', addContextFilter(context, backgroundFilter));
}