/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/global.js 
 * 
 * Reducer for global redux object
 * 
 * GLOBAL_SET_STATE: Updates global variable(s) using names/values in object
 * SET_TIME_RANGE: Updates time-specific variables
 * SET_AREA_SCALE: Updates areascale property
 */ 

import { initialStateGlobal } from "./initializers"

export default function selector(state=initialStateGlobal, action) {

    let newState = {...state};

    switch (action.type) {
  
        case 'GLOBAL_SET_STATE':
            Object.keys(action.object).forEach((key) => newState[key] = action.object[key]);                
            return newState;

        case 'SET_TIME_RANGE':
            newState.periodstart = action.periodstart;
            newState.periodend = action.periodend;            
            return newState;

        case 'SET_AREA_SCALE':
            newState.areascale = action.areascale;
            return newState;

        case 'FETCH_ALLPROPERTIES':
            newState = {...newState, allproperties: action.allproperties};
            return newState;
                
        case 'FETCH_CONTEXT':
            newState = {...newState, context: action.context};
            return newState;

        case 'RESET_CONTEXT':
            newState = {...newState, context: initialStateGlobal.context};
            return newState;

        case 'FETCH_EXTERNALREFERENCE':
            newState = {...newState, externalreferencedid: action.externalreferencedid};
            return newState;

        case 'FETCH_ENTITIES':
            let entitygeometries = []
            if (action.entities.entities !== undefined) {
                for(let i = 0; i < action.entities.entities.length; i++) {
                    if (action.entities.entities[i].geometrycodes !== undefined) {
                        for(let j = 0; j < action.entities.entities[i].geometrycodes.length; j++) {
                            entitygeometries.push(action.entities.entities[i].geometrycodes[j]);
                        }
                    }
                }
            }
            newState = {...newState, entities: action.entities, entitygeometries: entitygeometries};
            return newState;
    
        case 'RESET_ENTITIES':
            newState = {...newState, entities: initialStateGlobal.entities, entitygeometries: initialStateGlobal.entitygeometries};
            return newState;

        case 'UPDATE_ENTITY':
        case 'MESSAGE_ENTITY':
            // Do nothing
            newState = {...newState};
            return newState;

        default:
            return state;
    }
}
