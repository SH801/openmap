
function addContextFilter(context, filter) {
    if (context) return ["all", getContextFilter(context), filter];
    return filter;
}

function getContextFilter(context) {
    if (context) return ["in", "'" + context.id.toString() + "'", ["get", "contexts"]];
    return null;
}

export function mapReset(context, map) {
    map.setFilter('positivefarms_active', ["any"]);
    map.setFilter('positivefarms_background', getContextFilter(context));
} 

export function mapSelectEntity(context, map, entityid) {
    // We don't care about context for active entity - if user has selected it, make it active regardless
    map.setFilter('positivefarms_active', ["==", 'entityid', parseInt(entityid) ]);
    var backgroundFilter = ["!=", parseInt(entityid), ["get", "entityid"]];
    map.setFilter('positivefarms_background', addContextFilter(context, backgroundFilter));
} 

export function mapSelectProperty(context, map, propertyid) {
    var activeFilter = ['in', "'" + propertyid.toString() + "'", ['get', 'entityproperties']];
    var backgroundFilter = ['!', ['in', "'" + propertyid.toString() + "'", ['get', 'entityproperties']]];
    map.setFilter('positivefarms_active', addContextFilter(context, activeFilter));
    map.setFilter('positivefarms_background', addContextFilter(context, backgroundFilter));
}