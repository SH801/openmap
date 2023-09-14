/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Map.js 
 * 
 * Displays main map using Leafletjs
 * 
 * GeoJSON layer within map is reloaded if map is zoomed or moved beyond safe 'padding' area
 */ 

import React, { Component }  from 'react';
import { withSizes } from 'react-sizes'
import { connect, useSelector, useDispatch } from 'react-redux';
import { withRouter } from 'react-router';
import { global, map, areas, search } from "../actions";
import { setGlobalState, fetchEntitiesByProperty } from "../actions/global";
import { fetchSearchResults } from "../actions/search";
import { fetchGeometries } from "../actions/map";
import { useMapEvents, MapContainer, TileLayer, ZoomControl, GeoJSON, Tooltip } from 'react-leaflet';
// import { MapLibreTileLayer } from './MapLibreTileLayer.ts';

import * as QueryString from "query-string";

import Leaflet from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getURLState, setURLState, getURLSubdomain, getExternalReference } from "../functions/urlstate";
import { mapSizesToProps } from "../service/checkScreenSize";
import { 
  AREA_LEVEL_COLOURS, 
  AREA_HIGHLIGHT_COLOUR,
  AREA_STYLE_EDITING_ACTIVE_NOTSELECTABLE,
  AREA_STYLE_DEFAULT, 
  AREA_STYLE_CONTEXT,
  AREA_STYLE_MOUSEOVER,
  LEVELS, 
  DEFAULT_LAT, 
  DEFAULT_LNG, 
  DEFAULT_ZOOM,
  MAPCACHE_PIXELPADDING, 
  DESKTOP_PADDING,
  FITBOUNDS_PADDING,
} from "../constants";

function areaActive(level) {
  return {...AREA_STYLE_DEFAULT, 
    fillColor: AREA_LEVEL_COLOURS[0], 
    fillOpacity: 0.5,
  };
}

function areaHighlight() {
  return {...AREA_STYLE_DEFAULT, 
    fillColor: "orange", 
    fillOpacity: 0.9,
    weight: 1, 
    color: "orange",
    opacity: 1,   
  };
}

/**
 * getAreaProperties
 * 
 * Get properties of current map view, assuming map needs to be updated
 * If no update is required, eg. if user's view is moving within 'MAPCACHE_PIXELPADDING' border of last update,
 * then return null
 * 
 * @param {*} map 
 * @param {*} areaproperties 
 * @param {*} geometrytype 
 */
function getAreaProperties(map, areaproperties, geometrytype) {
  let zoom = map.getZoom();
  let mapbounds = map.getBounds();
  let northEast = mapbounds['_northEast'];
  let southWest = mapbounds['_southWest'];
  let xmin = southWest.lng;
  let ymin = southWest.lat;
  let xmax = northEast.lng;
  let ymax = northEast.lat;

  // We grab larger area than we need and only update if user goes beyond padded area
  // This allows flexibility in terms of the user moving around map    

  if ((areaproperties !== null) && (areaproperties.zoom === zoom) && (areaproperties.geometrytype === geometrytype)) {
    if ((xmin >= areaproperties.xmin) && (xmax <= areaproperties.xmax) && (ymin >= areaproperties.ymin) && (ymax <= areaproperties.ymax)) {
      // Hasn't moved sufficiently so don't reload data
      return null;
    }
  }
  
  areaproperties = {zoom: zoom, geometrytype: geometrytype, xmin: southWest.lng, ymin: southWest.lat, xmax: northEast.lng, ymax: northEast.lat};

  // Calculate padding using pixels

  let point = Leaflet.point(MAPCACHE_PIXELPADDING, MAPCACHE_PIXELPADDING);
  let markerCoords = map.containerPointToLatLng( point );
  let paddingy = (northEast.lat - markerCoords.lat);
  let paddingx = (markerCoords.lng - southWest.lng);

  areaproperties.xmin -= paddingx;
  areaproperties.xmax += paddingx;
  areaproperties.ymin -= paddingy;
  areaproperties.ymax += paddingy;

  return areaproperties;
}

/**
 * MapGeometry: React functional component to process map events
 * 
 * Fetch (GeoJSON) geometries every time map is moved (which includes on zooming in/out)
 * 
 * @param {*} props 
 */
function MapGeometry(props) {
  const dispatch = useDispatch();
  const global = useSelector(state => state.global);
  const mapstate = useSelector(state => state.map);

  const map = useMapEvents({
    moveend(e) {

      // If change in zoom level requires change of geometry selector, adjust accordingly 

      let zoom = map.getZoom();
      let center = map.getCenter();
      let geometry = global.geometry;
      if (geometry !== global.geometry) dispatch(setGlobalState({"geometry": geometry}));        

      // Re-render GeoJSON if necessary (checks to see whether sufficient change requires reload)
      let areaproperties = getAreaProperties(map, mapstate.areaproperties, geometry);
      if (areaproperties !== null) dispatch(fetchGeometries(areaproperties));
  
      // Refresh search results if geosearch on
      if (props.search.geosearch) {
        if ((props.search.geosearch !== null) && (props.isMobile !== null)) {
          dispatch(fetchEntitiesByProperty(props.search.geosearch, props.isMobile));
        }          
      }

      if (props.search.searchtext === '') {
        dispatch(fetchSearchResults(''));
      }

      setURLState({'lat': center.lat, 'lng': center.lng, 'zoom': zoom, 'g': geometry}, props.history, props.location);
    },
  })

  return null
}

/**
 * Map: Main React component for rendering map
 * 
 */
export class Map extends Component {

  state = {
    lat: null,
    lng: null,
    zoom: null,
    subdomain: null,
    scrollWheelZoom: true,	
    area: '',		
    bounds: null,
  }

  constructor(props) {
    super(props);

    if (!this.props.global.mapinitialized) {
      let subdomain = getURLSubdomain();
      let externalreference = getExternalReference();
      if (externalreference) {
        this.props.fetchExternalReference(externalreference).then(() => {
          if ((subdomain !== 'localhost') && (subdomain !== 'futurefarms')) {
            this.state.subdomain = subdomain;
            this.props.fetchContext(this.state.subdomain, this.props.isMobile).then(() => {
              this.props.setGlobalState({"mapinitialized": true});
            }) 
          } else {
            this.props.setGlobalState({"mapinitialized": true});
          }      
        })
      } else if ((subdomain !== 'localhost') && (subdomain !== 'futurefarms')) {
        this.state.subdomain = subdomain;
        this.props.fetchContext(this.state.subdomain, this.props.isMobile).then(() => {
          this.props.setGlobalState({"mapinitialized": true});
        }) 
      } else {
        this.props.setGlobalState({"mapinitialized": true});
      }  
    }

    this.state.lat = props.lat;
    this.state.lng = props.lng;
    this.state.zoom = props.zoom;  

    let params = QueryString.parse(this.props.location.search);
    if (params.lat !== undefined) this.state.lat = params.lat;
    if (params.lng !== undefined) this.state.lng = params.lng;
    if (params.zoom !== undefined) this.state.zoom = params.zoom;  
  }
    
  /**
   * setMap
   * 
   * Called when map is initially set
   * 
   * @param {*} mapref 
   */
  setMap = (mapref) => {
    let globalstate = {'map': mapref};
    // Set global 'geometry' if set in URL
    const geometry = getURLState('g', this.props.location);
    if (geometry !== null) globalstate['geometry'] = parseInt(geometry);        

    if (this.props.global.context) {
      const southWest = [this.props.global.context.bounds[1], this.props.global.context.bounds[0]];
      const northEast = [this.props.global.context.bounds[3], this.props.global.context.bounds[2]];
      mapref.fitBounds([southWest, northEast], {
        padding: [FITBOUNDS_PADDING, FITBOUNDS_PADDING],
        paddingBottomRight: this.props.isMobile ? [FITBOUNDS_PADDING, FITBOUNDS_PADDING] : DESKTOP_PADDING,
        animate: false,
      });  
      let bounds = mapref.getBounds();
      bounds._southWest.lat -= 0.1;
      bounds._southWest.lng -= 0.1;
      bounds._northEast.lat += 0.1;
      bounds._northEast.lng += 0.1;
      mapref.setMaxBounds(bounds);  

      let params = QueryString.parse(this.props.location.search);
      if ((params.lat !== undefined) &&
          (params.lng !== undefined) && 
          (params.zoom !== undefined)) {
            mapref.setView([params.lat, params.lng], params.zoom);
      } 
    }
    
    // Fetch (GeoJSON) geometries when we first load map
    this.props.setGlobalState(globalstate).then(() => {
      let areaproperties = getAreaProperties(mapref, this.props.map.areaproperties, this.props.global.geometry);
      if (areaproperties !== null) this.props.fetchGeometries(areaproperties);
      this.props.fetchAllProperties();

      if (this.props.global.externalreferencedid) {
        this.props.resetGeosearch();
        this.props.setGlobalState({'drawer': true});
        this.props.fetchEntity(this.props.global.externalreferencedid, this.props.isMobile).then(() => {
          this.props.redrawGeoJSON();
        });    
      }
  
    });

  }

  
  /**
   * getGeoJSONIndex
   * 
   * This is used to trigger a re-render of the GeoJSON layer
   * Change the value -> triggers redraw
   */
  getGeoJSONIndex = () => {
    return this.props.map.geojsoncounter;
  }

  getDefaultStyle(feature) {
    const code = feature.properties.code;
    // Show style of polygon depending on whether editing is on or not
    if (this.props.global.editentity) {
      if (this.props.map.selected.includes(code)) {
        return areaHighlight();
      } else {
        // If editing, make active and non-selectable polygons visible in special style
        if (this.props.map.active.geometrycodes.includes(code) && !this.getSelectable(code)) {
          return AREA_STYLE_EDITING_ACTIVE_NOTSELECTABLE;
        } else {
          return AREA_STYLE_DEFAULT;
        }
      }
    } else {
      // If not editing, only allow active polygons to be visible
      if (this.props.map.active.geometrycodes.includes(code)) {
        if (this.props.global.entitygeometries.includes(code)) {
          return areaHighlight();
        } else {
          return areaActive(this.props.global.geometry);
        }
      } else {
        return AREA_STYLE_DEFAULT;
      }        
    }
  }

  /**
   * geojsonStyle
   * 
   * Style GeoJSON polygon differently depending on whether it's active or not
   * 
   * @param {*} feature 
   */
  geojsonStyle = (feature) => {
    return this.getDefaultStyle(feature);
  }

  /**
   * onGeoJSONMouseOver
   * 
   * Change style of GeoJSON polygon for mouse over 
   * 
   * @param {*} area 
   */
  onGeoJSONMouseOver = (area) => {
    const code = area.layer.feature.properties.name;
    const geometrytype = area.layer.feature.properties.geometrytype;
    const areatext = LEVELS[geometrytype - 1] + ": " + code;
    this.setState({area: areatext});

    if (this.props.global.editentity) {
      if (this.getSelectable(code)) {
        area.layer.setStyle(AREA_STYLE_MOUSEOVER);    
      }        
    } else {
      if (this.props.map.active.geometrycodes.includes(code)) {
        area.sourceTarget.openPopup();
        area.layer.setStyle(AREA_STYLE_MOUSEOVER);    
      }  
    }
  }

  /**
   * onGeoJSONMouseOut
   * 
   * Revert style of GeoJSON polygon on mouse out
   * 
   * @param {*} area 
   */
  onGeoJSONMouseOut = (area) => {
    this.setState({area: ''});
    area.sourceTarget.closePopup();
    area.layer.setStyle(this.getDefaultStyle(area.layer.feature));    
  }

  /**
   * getSelectable
   * 
   * Returns true or false depending on whether polygon can be selected
   * 
   * @param {*} code 
   */
  getSelectable = (code) => {
    if (this.props.map.editablegeometrycodes.includes(code)) return true;
    if (this.props.map.active.geometrycodes.includes(code)) return false;
    return true;
  }

  /**
   * onGeoJSONClick
   * 
   * Select area on click
   * 
   * @param {*} area 
   */
  onGeoJSONClick = (area) => {
        
    // Workaround for bug in Safari and Leaflet where two clicks are generated 
    // See https://github.com/Leaflet/Leaflet/issues/7255
    // Only one click has isTrusted=true

    if (!area.originalEvent.isTrusted) return;

    const code = area.layer.feature.properties.code;

    if (this.props.global.editentity) {
      if (this.getSelectable(code)) {
        if (this.props.map.selected.includes(code)) {
          this.props.deleteSelected(code).then(() => {this.props.redrawGeoJSON()});
        } else {
          this.props.addSelected(code).then(() => {this.props.redrawGeoJSON()});
        }
      }        
    } else {
      if (this.props.map.active.geometrycodes.includes(code)) {
        this.props.setGlobalState({'drawer': true, 'searching': false});
        this.props.resetGeosearch();
        this.props.fetchEntityByGeometryCode(code, this.props.isMobile).then(() => {
          const entity = this.props.global.entities.entities[0];
          this.props.setSearchText(entity['name']);
          this.props.fetchSearchResults(entity['name']);
          this.props.redrawGeoJSON();
        });    
      } else {
        console.log("Clicking on non-active", code);
      }  
    }
  }

  /**
   * onEachFeature
   * 
   * Bind popup to each feature
   * 
   * @param {*} feature 
   * @param {*} layer 
   */
  onEachFeature = (feature, layer) => {
    const code = layer.feature.properties.code;
    if (this.props.map.active.geometrycodes.includes(code)) {
      layer.bindPopup(this.props.map.active.entitylookup[code]);    
    }
  }

  render() {
    return (
      <>
      {this.props.global.mapinitialized ? (
        <MapContainer 
        center={[this.state.lat, this.state.lng]} 
        zoom={this.state.zoom} 
        zoomSnap={1}
        maxZoom="15"
        zoomControl={false}
        scrollWheelZoom={this.state.scrollWheelZoom} 
        style={{ height: "100%", width: "100vw" }}
        tap={true}
        dragging={true}          
        whenCreated={this.setMap} >
        <ZoomControl position={this.props.isMobile ? "bottomright" : "topleft"} />
        {/* <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        /> */}
        {/* <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png"
        /> */}
        <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
        />
        {/* <MapLibreTileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json"
        />         */}

        <MapGeometry 
          isMobile={this.props.isMobile}
          search={this.props.search} 
          subdomain={this.state.subdomain} 
          location={this.props.location} 
          history={this.props.history} />

        {this.props.global.context ? (
        <GeoJSON style={AREA_STYLE_CONTEXT} data={this.props.global.context.geometry} />
        ) : null}

        <GeoJSON eventHandlers={{
            mouseover: this.onGeoJSONMouseOver,
            mouseout: this.onGeoJSONMouseOut,
            click: this.onGeoJSONClick,
          }}
          onEachFeature={this.onEachFeature}
          style={this.geojsonStyle} 
          key={this.getGeoJSONIndex(this.props.map.geometries)} 
          data={this.props.map.geometries} >
        </GeoJSON>

        {this.state.tooltip ? (
              <Tooltip direction="top" permanent={true}>
                <div>Tooltip</div>
              </Tooltip>
            ) : null}

      </MapContainer> 
      ) : null}
      </>
    )
  }
}

Map.defaultProps = {
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  zoom: DEFAULT_ZOOM,
};


export const mapStateToProps = state => {
    return {
      global: state.global,
      map: state.map,
      areas: state.areas,
      search: state.search,
    }
}
    
export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
          return dispatch(global.setGlobalState(globalstate));
      },  
      setSearchText: (searchtext) => {
        return dispatch(search.setSearchText(searchtext));
      },      
      fetchAllProperties: () => {
        return dispatch(global.fetchAllProperties());
      },  
      fetchSearchResults: (searchtext) => {
        return dispatch(search.fetchSearchResults(searchtext));
      },        
      fetchContext: (context, isMobile) => {
        return dispatch(global.fetchContext(context, isMobile));
      },  
      fetchExternalReference: (externalreference) => {
        return dispatch(global.fetchExternalReference(externalreference));
      },  
      fetchEntity: (id, isMobile) => {
        return dispatch(global.fetchEntity(id, isMobile));
      },        
      fetchEntityByGeometryCode: (geometrycode, isMobile) => {
        return dispatch(global.fetchEntityByGeometryCode(geometrycode, isMobile));
      },  
      fetchEntitiesByProperty: (propertyid, isMobile) => {
        return dispatch(global.fetchEntitiesByProperty(propertyid, isMobile));
      },    
      resetGeosearch: () => {
        return dispatch(search.resetGeosearch());
      },                  
      redrawGeoJSON: () => {
        return dispatch(map.redrawGeoJSON());
      },  
      fetchGeometries: (areaproperties) => {
        return dispatch(map.fetchGeometries(areaproperties));
      },  
      setSelected: (selected) => {
        return dispatch(map.setSelected(selected));
      },           
      resetSelected: () => {
        return dispatch(map.resetSelected());
      },           
      addSelected: (selected) => {
        return dispatch(map.addSelected(selected));
      },           
      deleteSelected: (selected) => {
        return dispatch(map.deleteSelected(selected));
      },           
      addArea: (key, history, location, updateurl) => {
        return dispatch(areas.addArea(key, history, location, updateurl));
      },      
      deleteArea: (key, history, location) => {
        return dispatch(areas.deleteArea(key, history, location));
      },      
  }
}  

export default withSizes(mapSizesToProps)(withRouter(connect(mapStateToProps, mapDispatchToProps)(Map)));