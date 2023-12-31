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

import { API_URL, DESKTOP_PADDING } from "../constants";
import { setURLState } from "../functions/urlstate";

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
              'geometry': JSON.parse(res.data['geojson']),
            }]
          }
          return dispatch({type: 'FETCH_CONTEXT', context: res.data});
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
    const { map } = getState().global;
    let center = map.getCenter();    
    searchcriteria.lat = center.lat;
    searchcriteria.lng = center.lng;
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
          if (res.data.bounds !== undefined) {
            // Only fitbounds if not list, ie. single entity
            if (searchcriteria['list'] === false) {
              const { map } = getState().global;
              const southWest = [res.data.bounds[1], res.data.bounds[0]]
              const northEast = [res.data.bounds[3], res.data.bounds[2]]
              map.fitBounds([southWest, northEast], {
                paddingBottomRight: isMobile ? [0, 0] : DESKTOP_PADDING,
                animate: true,
              });    
            }
          }

          return dispatch({type: 'FETCH_ENTITIES', entities: res.data});
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