/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * actions/map.js 
 * 
 * Actions for map redux object
 */ 

import { API_URL, EDIT_ZOOM, MAPCACHE_PIXELPADDING, DESKTOP_PADDING, FITBOUNDS_PADDING } from "../constants";
import Leaflet from 'leaflet';

/**
 * fetchGeometries
 * 
 * Fetches geometry data from backend server and carries out basic data processing
 * (due to optimized delivery of GeoJSON data)
 * 
 * @param {*} areaproperties 
 */
export const fetchGeometries = (areaproperties) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    const context = getState().global.context;
    if (context) areaproperties['context'] = context['shortcode'];   
    let body = JSON.stringify(areaproperties);

    return fetch(API_URL + "/geometries/", {headers, method: "POST", body})
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          const active = res.data['active'];
          const geometries = {
            type: 'FeatureCollection',
            features:
               (res.data['features']).map(segment =>({
                  'type':'Feature',
                  'geometry': JSON.parse(segment.json),
                  'properties': {
                     'name': segment.name,
                     'code': segment.code,
                     'type': segment.type,
                     'geometrytype': areaproperties['geometrytype']
                    }
               })
            )
          }

          return dispatch({type: 'FETCH_GEOMETRIES', areaproperties: areaproperties, geometries: geometries, active: active});
        }         
      })
  }
}

/**
 * redrawGeoJSON
 * 
 * Issues 'REDRAW_GEOJSON' message to initiate redraw of GeoJSON layer
 */
export const redrawGeoJSON = () => {
  return (dispatch, getState) => {
    dispatch({type: 'REDRAW_GEOJSON'});
    return Promise.resolve(true);
  }
}

/**
 * zoomToArea
 * 
 * Queries backend system for bounding box of a particular geographical region 
 * Once bounding box parameters have been received, it issues 'fitBounds' on map object to fit bbox within map view
 * 
 * @param {*} areacode 
 * @param {*} isMobile
 */
export const zoomToArea = (code, isMobile) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let body = JSON.stringify({code: code});

    return fetch(API_URL + "/geometrybounds/", {headers, method: "POST", body})
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          const map = getState().global.map;   
          if (map === null) return;

          const southWest = [res.data.rect[1], res.data.rect[0]]
          const northEast = [res.data.rect[3], res.data.rect[2]]
          map.fitBounds([southWest, northEast], {
            padding: [FITBOUNDS_PADDING, FITBOUNDS_PADDING],
            paddingBottomRight: isMobile ? [FITBOUNDS_PADDING, FITBOUNDS_PADDING] : DESKTOP_PADDING,
            animate: false,
          });  

        } 
      })
  }
}

/**
 * gotoLocation
 * 
 * Queries backend system for coordinates of a location or postcode
 * Once coordinates have been received, it issues 'flyTo' on map object to move to that position
 * 
 * @param {*} location 
 */
export const gotoLocation = (location) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};

    return fetch(API_URL + "/locationposition?location=" + encodeURIComponent(location), {headers, method: "GET"})
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          const { map } = getState().global;

          if (res.data.result === 'success') {
            map.flyTo({lng: res.data.data.lng, lat: res.data.data.lat}, res.data.data.zoom, {animate: false});
          }
        }
      })
  }
}

/**
 * enterMapEdit
 * 
 * Enter edit mode which forces map to zoom to sufficient level to show land polygons
 * 
 * @param {*} editablegeometrycodes
 */
export const enterMapEdit = (editablegeometrycodes) => {
  return (dispatch, getState) => {
    const map = getState().global.map;   
    if (map === null) return;
    let zoom = map.getZoom();
    if (zoom < EDIT_ZOOM) map.setView(map.getCenter(), EDIT_ZOOM);
    map.setMinZoom(EDIT_ZOOM);
    dispatch({type: 'SET_EDITABLEGEOMETRYCODES', editablegeometrycodes: editablegeometrycodes});
    return Promise.resolve(true);
  }
}

/**
 * exitMapEdit
 * 
 * Exit edit mode which allows map to go to normal min zoom
 * 
 */
export const exitMapEdit = () => {
  return (dispatch, getState) => {
    const map = getState().global.map;   
    if (map === null) return;
    map.setMinZoom(0);
    dispatch({type: 'RESET_EDITABLEGEOMETRYCODES'});
    return Promise.resolve(true);
  }
}

/**
 * refreshMapData
 * 
 * Reloads all map data, typically after data change
 * 
 */
export const refreshMapData = () => {
  return (dispatch, getState) => {

    const map = getState().global.map;   
    if (map === null) return;

    let zoom = map.getZoom();
    let mapbounds = map.getBounds();
    let northEast = mapbounds['_northEast'];
    let southWest = mapbounds['_southWest'];
    let areaproperties = {
        zoom: zoom, 
        geometrytype: 1, 
        xmin: southWest.lng, 
        ymin: southWest.lat, 
        xmax: northEast.lng, 
        ymax: northEast.lat
    };

    // Calculate padding using pixels

    let point = Leaflet.point(MAPCACHE_PIXELPADDING, MAPCACHE_PIXELPADDING);
    let markerCoords = map.containerPointToLatLng( point );
    let paddingy = (northEast.lat - markerCoords.lat);
    let paddingx = (markerCoords.lng - southWest.lng);

    areaproperties.xmin -= paddingx;
    areaproperties.xmax += paddingx;
    areaproperties.ymin -= paddingy;
    areaproperties.ymax += paddingy;

    let headers = {"Content-Type": "application/json"};
    const context = getState().global.context;
    if (context) areaproperties['context'] = context['shortcode'];   
    let body = JSON.stringify(areaproperties);

    return fetch(API_URL + "/geometries/", {headers, method: "POST", body})
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          const active = res.data['active'];
          const geometries = {
            type: 'FeatureCollection',
            features:
               (res.data['features']).map(segment =>({
                  'type':'Feature',
                  'geometry': JSON.parse(segment.json),
                  'properties': {
                     'name': segment.name,
                     'code': segment.code,
                     'type': segment.type,
                     'geometrytype': areaproperties['geometrytype']
                    }
               })
            )
          }

          return dispatch({type: 'FETCH_GEOMETRIES', areaproperties: areaproperties, geometries: geometries, active: active});
        }         
      })    
  }
}

/**
 * setSelected
 * 
 * Sets selected areas on map
 */
export const setSelected = (selected) => {
  return (dispatch, getState) => {
    dispatch({type: 'SET_SELECTED', selected: selected});
    return Promise.resolve(true);
  }
}


/**
 * resetSelected
 * 
 * Resets selected areas on map
 */
export const resetSelected = (selected) => {
  return (dispatch, getState) => {
    dispatch({type: 'RESET_SELECTED'});
    return Promise.resolve(true);
  }
}

/**
 * addSelected
 * 
 * Adds selected area to selected areas on map
 */
export const addSelected = (selected) => {
  return (dispatch, getState) => {
    dispatch({type: 'ADD_SELECTED', selected: selected});
    return Promise.resolve(true);
  }
}

/**
 * deleteSelected
 * 
 * Deletes selected area from selected areas on map
 */
export const deleteSelected = (selected) => {
  return (dispatch, getState) => {
    dispatch({type: 'DELETE_SELECTED', selected: selected});
    return Promise.resolve(true);
  }
}


