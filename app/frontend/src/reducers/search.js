/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/search.js 
 * 
 * Reducer for search redux object
 * 
 * FETCH_SEARCHRESULTS: Updates state with data from backend 
 */ 

import { initialStateSearch } from "./initializers"
  
export default function map(state=initialStateSearch, action) {

    let newState = { ...state};    

    switch (action.type) {

        case 'SET_SEARCHTEXT':
            newState = {...newState, searchtext: action.searchtext};
            return newState;

        case 'SET_GEOSEARCH':
            newState = {...newState, geosearch: action.geosearch};
            return newState;

        case 'RESET_GEOSEARCH':
            newState = {...newState, geosearch: initialStateSearch.geosearch};
            return newState;
                
        case 'FETCH_SEARCHRESULTS':
            newState = {...newState, searchresults: action.searchresults};
            return newState;

        case 'RESET_SEARCHRESULTS':
            newState = {...newState, searchresults: initialStateSearch.searchresults};
            return newState;

        case 'RESET_SEARCH':
            newState = {...newState, geosearch: initialStateSearch.geosearch, searchtext: initialStateSearch.searchtext, searchresults: initialStateSearch.searchresults};
            return newState;
                
        default:
            return state;
    }
}
