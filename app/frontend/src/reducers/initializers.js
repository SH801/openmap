/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/initializers.js 
 * 
 * react-redux reducer initializers
 */ 

import { periodstart, periodend, areascale } from "../constants";

// Set up initial state of some global variables using constants
export const initialStateGlobal = {
    showsignupmodal: false,
    showcontactmodal: false,
    geometry: 1,
    mapref: null,
    periodstart: periodstart,
    periodend: periodend,
    areascale: areascale,
    activegeometry: null,
    allproperties: [],
    context: null,
    contextinitialized: false,
    mapinitialized: false,
    searching: false,
    drawer: false,
    // For entities, distinguish between 'null' (no search results) and [] (no records in search results)
    entities: {'entities': null}, 
    entitygeometries: [],
    editentity: null,
    externalreferencedid: null,
};

export const initialStateMap = {
    areaproperties: null,
    geometries: null,
    geojsoncounter: 0,
    selected: [],
    active: [],
    editablegeometrycodes: [],
};

export const initialStateAreas = {
    areas: {},
    maxvalue: 0,
};

export const initialStateSearch = {
    geosearch: null,
    searchtext: '',
    searchresults: [],
};