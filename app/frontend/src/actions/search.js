/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * actions/search.js 
 * 
 * Actions for search redux object
 */ 

import { API_URL } from "../constants";

/**
 * setSearchText
 * 
 * Sets search text value
 */
export const setSearchText = (searchtext) => {
  return (dispatch, getState) => {
    dispatch({type: 'SET_SEARCHTEXT', searchtext: searchtext});
    return Promise.resolve(true);
  }
}


/**
 * fetchSearchResults
 * 
 * Fetches search results from backend server
 * 
 * @param {*} searchtext 
 */
export const fetchSearchResults = (searchtext) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let searchcriteria = {searchtext: searchtext};
    const { mapref } = getState().global;
    if (mapref) {
      const map = mapref.current.getMap();
      const center = map.getCenter();    
      searchcriteria.lat = center.lat;
      searchcriteria.lng = center.lng;  
    }
    let context = getState().global.context;
    if (context) searchcriteria.context = context.shortcode;
    let body = JSON.stringify(searchcriteria);

    return fetch(API_URL + "/search/", {headers, method: "POST", body})
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
            const { searchtext } = getState().search;
            // Check searchtext of results in case we still have results 
            // coming back from earlier searches
            if (res.data.searchtext === searchtext) {
              return dispatch({type: 'FETCH_SEARCHRESULTS', searchresults: res.data.results});
            } else {

            }
        }         
      })
  }
}

/**
 * resetSearchResults
 * 
 * Resets 'searchresults' variable
 */
export const resetSearchResults = () => {
    return (dispatch, getState) => {
      dispatch({type: 'RESET_SEARCHRESULTS'});
      return Promise.resolve(true);
    }
}

/**
 * resetSearch
 * 
 * Resets entire search
 */
export const resetSearch = () => {
  return (dispatch, getState) => {
    dispatch({type: 'RESET_SEARCH'});
    return Promise.resolve(true);
  }
}

/**
 * setGeosearch
 * 
 * Sets geosearch
 */
export const setGeosearch = (geosearch) => {
  return (dispatch, getState) => {
    dispatch({type: 'SET_GEOSEARCH', geosearch: geosearch});
    return Promise.resolve(true);
  }
}

/**
 * resetGeosearch
 * 
 * Resets geosearch
 */
export const resetGeosearch = () => {
  return (dispatch, getState) => {
    dispatch({type: 'RESET_GEOSEARCH'});
    return Promise.resolve(true);
  }
}


