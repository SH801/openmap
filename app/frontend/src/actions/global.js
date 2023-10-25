/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * action/global.js 
 * 
 * Actions for global redux object
 */ 

import { v4 as uuidv4 } from 'uuid';
import { API_URL, FLYINGTOUR_LINGERTIME } from "../constants";
import { setURLState } from "../functions/urlstate";
import { mapSelectEntity } from '../functions/map';
import toast from 'react-hot-toast';

/**
 * setGlobalState
 * 
 * Sets global state using a list of names/values represented by object
 * 
 * @param {*} object 
 */
export const setGlobalState = (object) => {
    return (dispatch, getState) => {
      dispatch({type: 'GLOBAL_SET_STATE', object: object});
      return Promise.resolve(true);
    }
}

/**
 * setTimeRange
 * 
 * Sets global yearstart/yearend  
 * 
 * @param {*} periodstart 
 * @param {*} periodend 
 * @param {*} history 
 * @param {*} location 
 */
export const setTimeRange = (periodstart, periodend, history, location) => {
  return setGlobalState({'periodstart': periodstart, 'periodend': periodend});
}

/**
 * setAreaScale
 * 
 * Sets global areascale 
 * 
 * @param {*} areascale 
 * @param {*} history 
 * @param {*} location 
 */
export const setAreaScale = (areascale, history, location) => {
  return setGlobalState({'areascale': areascale});
}

/**
 * setGeometry
 * 
 * Set global geometry including setting equivalent URL parameter
 * 
 * @param {*} geometry 
 * @param {*} history 
 * @param {*} location 
 */
export const setGeometry = (geometry, history, location) => {
  setURLState({'g': geometry}, history, location);
  return setGlobalState({'geometry': geometry});
}


/**
 * fetchContext
 * 
 * Fetches context from backend server using context shortcode
 * 
 * @param {*} context
 */
export const fetchContext = (context, isMobile) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};

    return fetch(API_URL + "/context/" + context.toLowerCase(), {headers, method: "POST"})
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
          res.data['geometry'] = {
            type: 'FeatureCollection',
            features: [{
              'type':'Feature',
              'geometry': res.data['geojson'],
            }]
          }
          return dispatch({type: 'FETCH_CONTEXT', context: res.data});
        }         
      })
  }
}

/**
 * fetchLastExport
 * 
 * Fetches date of last export from backend server in order to check whether map update required
 * 
 */
export const fetchLastExport = () => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    return fetch(API_URL + "/lastexport/", {headers, method: "POST"})
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
          let dataupdatepending = false;
          if (res.data['lastexport']) {
            const lastexport = getState().global.lastexport;
            if ((lastexport !== null) & (lastexport !== res.data['lastexport'])) {
              console.log("Data update pending, refreshing map after delay...");
              setTimeout(() => {
                console.log("Refreshing map");
                const { mapref } = getState().global;
                if (mapref) {
                  const map = mapref.current.getMap();
                  map.style.sourceCaches['positivefarms'].clearTiles()
                  map.style.sourceCaches['positivefarms'].update(map.transform)
                  map.triggerRepaint()
                }  
              }, 10000);
            }
          }
          return dispatch({type: 'FETCH_LASTEXPORT', dataupdatepending: dataupdatepending, lastexport: res.data['lastexport']});
        }         
      })
  }
}

/**
 * fetchExternalReference
 * 
 * Attempts to retrieve entity info using external reference
 * 
 * @param {*} externalreference
 */
export const fetchExternalReference = (externalreference) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};

    return fetch(API_URL + "/externalref/" + externalreference, {headers, method: "POST"})
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
          return dispatch({type: 'FETCH_EXTERNALREFERENCE', externalreferencedid: res.data});
        }         
      })
  }
}

/**
 * fetchEntities
 * 
 * Fetches entities from backend server using search criteria
 * 
 * @param {*} searchcriteria
 */
export const fetchEntities = (searchcriteria, isMobile) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    const context = getState().global.context;
    if (context) searchcriteria['context'] = context['shortcode'];
    const { mapref } = getState().global;
    if (mapref) {
      const map = mapref.current.getMap();
      const center = map.getCenter();    
      searchcriteria.lat = center.lat;
      searchcriteria.lng = center.lng;  
    }
    let body = JSON.stringify(searchcriteria);

    return fetch(API_URL + "/entities/", {headers, method: "POST", body})
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
          var centre = null;
          var zoom = null;
          var fittingbounds = false;
          if (res.data.bounds !== undefined) {
            // Only fitbounds if not list, ie. single entity
            if (searchcriteria['list'] === false) {
              if (mapref) {
                var map = mapref.current.getMap();
                const southWest = [res.data.bounds[0], res.data.bounds[1]]
                const northEast = [res.data.bounds[2], res.data.bounds[3]]
                centre = [(res.data.bounds[0] + res.data.bounds[2]) / 2, 
                          (res.data.bounds[1] + res.data.bounds[3]) / 2];
                if (map.getZoom() > 15) {
                  map.setZoom(15);
                }
                map.fitBounds([southWest, northEast], {
                  animate: true
                }); 
                fittingbounds = true;
              }
            } else {
              const flying = getState().global.flying;
              if (flying) startFlyingTourAction(false, dispatch, getState, res.data);          
            }
          }

          return dispatch({type: 'FETCH_ENTITIES', entities: res.data, centre: centre, zoom: zoom, fittingbounds: fittingbounds});
        }         
      })
  }
}


/**
 * fetchEntitiesByProperties
 * 
 * Fetches entities from backend server using array of property ids
 * 
 * @param {*} propertyids
 */
export const fetchEntitiesByProperties = (propertyids, isMobile) => {
  return fetchEntities({list: true, properties: propertyids}, isMobile);
}


/**
 * fetchEntitiesByProperty
 * 
 * Fetches entities from backend server using property id
 * 
 * @param {*} propertyid
 */
export const fetchEntitiesByProperty = (propertyid, isMobile) => {
  return fetchEntities({list: true, properties: [propertyid]}, isMobile);
}


/**
 * addAsset
 * 
 * Add user-specific asset
 * 
 * @param {*} asset
 */
export const addAsset = (asset) => {

  return (dispatch, getState) => {
    var feature = null;
    let id = uuidv4();

    switch(asset.type) {
      case "wind":
        feature = {
          type: "Feature",
          id: id,
          properties: {
            id: id,
            type: "wind"
          },
          geometry: {
            type: "Point",
            coordinates: [asset.lng, asset.lat]
          }
        }
        break;
      case "solar":
        feature = {
          type: "Feature",
          id: id,
          properties: {
            id: id,
            type: "solar"
          },
          geometry: {
            type: "MultiPolygon",
            coordinates: asset.coordinates
          }
        }
        break;
    }  

    return dispatch({type: 'ADD_FEATURE', feature: feature});
  }
}

/**
 * deleteAsset
 * 
 * Delete user-specific asset
 * 
 * @param {*} featureid
 */
export const deleteAsset = (featureid) => {
  return (dispatch, getState) => {
    return dispatch({type: 'DELETE_FEATURE', featureid: featureid});
  }
}

/**
 * nextstepFlyingTour
 * 
 * Performs first step of flying tour and then calls setTimeout to run next step
 * 
 * @param {*} dispatch
 * @param {*} getstate
 * @param {*} entities
 */
export const nextstepFlyingTour = (initial, dispatch, getState, entities) => {
  var flyingtimer = getState().global.flyingtimer;
  if (flyingtimer) {
    clearTimeout(flyingtimer);
    setGlobalState({'flyingtimer': null});
  }

  if (!(getState().global.flying) && (!initial)) {
    console.log("Not flying and not initial - quitting");
    return;
  }

  var flyingindex = getState().global.flyingindex;
  console.log("Moving to next item in search results", flyingindex);

  const { mapref } = getState().global;
  var centre = null;
  var zoom = null;
  if (mapref) {
    const map = mapref.current.getMap();
    if (flyingindex > (entities['entities'].length - 1)) {
      toast.success('Flying tour has completed');          
      clearTimeout(flyingtimer);
      setGlobalState({'flyingtimer': null});  
      return;
    }

    if (!initial) toast.success('Moving to next location...');

    const entity = entities['entities'][flyingindex];
    const entityid = entity['id'];
    mapSelectEntity(getState().global.context, map, entityid);
    const southWest = [entity.bounds[0], entity.bounds[1]]
    const northEast = [entity.bounds[2], entity.bounds[3]]
    centre = [(entity.bounds[0] + entity.bounds[2]) / 2, 
              (entity.bounds[1] + entity.bounds[3]) / 2];
    if (map.getZoom() > 15) map.setZoom(15);
    map.fitBounds([southWest, northEast], {animate: true}); 
    // zoom = map.getZoom();
    // As we're now at entity, make distance zero
    entity['distance'] = null;

    flyingindex++;
    dispatch({type: 'RESET_GEOSEARCH'});
    dispatch({type: 'GLOBAL_SET_STATE', object: {
      'centre': centre,
      'zoom': zoom,
      'fittingbounds': true,
      'drawer': true, 
      'searching': false, 
      'flyingindex': flyingindex,
      'entities': {'list': false, 'entities': [entity]}
    }});  

    flyingtimer = setTimeout(() => {nextstepFlyingTour(false, dispatch, getState, entities)}, FLYINGTOUR_LINGERTIME);
    dispatch({type: 'GLOBAL_SET_STATE', object: {flyingtimer: flyingtimer}});
  }
}

/**
 * startFlyingTourAction
 * 
 * Go on tour of provided entities
 * 
 * @param {*} entities
 */
export const startFlyingTourAction = (initial, dispatch, getState, entities) => {

  toast.success('Starting flying tour of search results');

  var flyingtimer = getState().global.flyingtimer;
  if (flyingtimer) clearTimeout(flyingtimer);
  flyingtimer = setTimeout(() => {nextstepFlyingTour(initial, dispatch, getState, entities)}, 500);
  dispatch({type: 'GLOBAL_SET_STATE', object: {flyingtimer: flyingtimer, flyingindex: 0}});
}

/**
 * startFlyingTour
 * 
 * Go on tour of provided entities
 * 
 * @param {*} entities
 */
export const startFlyingTour = (entities) => {
  return (dispatch, getState) => {
    startFlyingTourAction(true, dispatch, getState, entities);
    return Promise.resolve(true);
  }
}

/**
 * fetchEntity
 * 
 * Fetches entity from backend server using entity's id
 * 
 * @param {*} id 
 */
export const fetchEntity = (id, isMobile) => {
  return fetchEntities({list: false, id: id}, isMobile);
}


/**
 * fetchEntityByGeometryCode
 * 
 * Fetches entity from backend server using entity's geometry code
 * 
 * @param {*} id 
 */
export const fetchEntityByGeometryCode = (geometrycode, isMobile) => {
  return fetchEntities({list: false, geometrycode: geometrycode}, isMobile);
}


/**
 * resetEntities
 * 
 * Resets 'entities' variable
 */
export const resetEntities = () => {
    return (dispatch, getState) => {
      dispatch({type: 'RESET_ENTITIES'});
      return Promise.resolve(true);
    }
}

/**
 * updateEntity
 * 
 * Updates entity at backend server. If id == -1, create new entity
 * 
 * @param {*} entity
 */
export const updateEntity = (entity) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let {token} = getState().auth;
    if (token) headers["Authorization"] = `Token ${token}`;
    let body = JSON.stringify(entity);

    return fetch(API_URL + "/api/entity/", {headers, method: "POST", body})
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
          return dispatch({type: 'UPDATE_ENTITY', entity: entity});
        }         
      })
  }
}

/**
 * messageEntity
 * 
 * Attempt to send message to entity
 * 
 * @param {*} message
 */
export const messageEntity = (message) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let body = JSON.stringify(message);

    return fetch(API_URL + "/message/", {headers, method: "POST", body})
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
          return dispatch({type: 'MESSAGE_ENTITY', message: message});
        }         
      })
  }
}
/**
 * fetchAllProperties
 * 
 * Fetches all properties from backend server
 * 
 */
export const fetchAllProperties = () => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
 
    return fetch(API_URL + "/properties/", {headers, method: "POST"})
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
          return dispatch({type: 'FETCH_ALLPROPERTIES', allproperties: res.data});
        }         
      })
  }
}