/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * functions/urlstate.js 
 * 
 * Helper functions for getting and setting variable parameters in the user's browser address bar
 */ 

import queryString from "query-string";

// List of variables that are meant to be arrays
const arrayvariables = ['a'];

/**
 * getURLState
 * Get value of specific variable contained in URL
 * 
 * @param {*} variablename 
 * @param {*} location 
 */
export const getURLState = (variablename, location) => {

    // Parse location.search for parameters
    let urlparams = queryString.parse(location.search);
    if (!(variablename in urlparams)) {
        if (arrayvariables.includes(variablename)) return []; // If variable is array, return empty array for null value
        else return null;
    }

    // Variable found in URL params
    let variablevalue = urlparams[variablename];

    // If value is meant to be array, turn single value into a single-element array
    if (arrayvariables.includes(variablename) && !Array.isArray(variablevalue)) variablevalue = [variablevalue];

    return variablevalue;
}

/**
 * setURLState
 * Set value of specific variables in URL that are defined in 'object'
 * 
 * @param {*} object 
 * @param {*} history 
 * @param {*} location 
 */
export const setURLState = (object, history, location) => {

    // Parse location.search for parameters
    let urlparams = queryString.parse(location.search);

    // Iterate through elements of new state object
    Object.keys(object).forEach((variablename) => {
        const variablevalue = object[variablename];

        // How to set new value depends on whether element is meant to be part of array
        if (arrayvariables.includes(variablename)) {
            let existingvalue = urlparams[variablename];
            if (existingvalue === undefined) existingvalue = [];
            else if (!Array.isArray(existingvalue)) existingvalue = [existingvalue];
            if (!existingvalue.includes(variablevalue)) existingvalue.push(variablevalue);
            urlparams[variablename] = existingvalue;
        } else urlparams[variablename] = variablevalue;
    })

    history.replace({pathname: location.pathname, search: queryString.stringify(urlparams)});  
}

/**
 * getURLSubdomain
 * Get subdomain of URL
 * 
 */
export const getURLSubdomain = () => {
    return window.location.hostname.split('.')[0]
}

/**
 * getExternalReference
 * Get external reference from URL
 * 
 */
export const getExternalReference = () => {
    let path = window.location.pathname.replace('/', '');
    if (path === "") return null;
    return path;
}

/**
 * deleteURLState
 * Delete specific variables in URL that are defined in 'object'
 * 
 * @param {*} deleteobject 
 * @param {*} history 
 * @param {*} location 
 */
export const deleteURLState = (deleteobject, history, location) => {

    // Parse location.search for parameters
    let urlparams = queryString.parse(location.search);

    // Iterate through elements of delete object
    Object.keys(deleteobject).forEach((variablename) => {
        const variablevalue = deleteobject[variablename];

        // How to delete value depends on whether element is meant to be part of array
        if (arrayvariables.includes(variablename)) {
            let existingvalue = urlparams[variablename];
            if (existingvalue === undefined) existingvalue = [];
            else if (!Array.isArray(existingvalue)) existingvalue = [existingvalue];
            const variableposition = existingvalue.indexOf(variablevalue);
            if (variableposition !== -1) existingvalue.splice(variableposition, 1);
        } else delete urlparams[variablename];
    })

    history.replace({pathname: location.pathname, search: queryString.stringify(urlparams)});  
}
