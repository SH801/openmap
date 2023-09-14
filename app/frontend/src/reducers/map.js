/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/map.js 
 * 
 * Reducer for map redux object
 * 
 * FETCH_GEOMETRIES: Updates state with data from backend and triggers redraw of GeoJSON layer by incrementing 'geojsoncounter'
 * REDRAW_GEOJSON: Trigger redraw of GeoJSON layer by incrementing 'geojsoncounter'
 */ 

import { initialStateMap } from "./initializers"
  
export default function map(state=initialStateMap, action) {

    let newState = { ...state};    

    switch (action.type) {

        case 'FETCH_GEOMETRIES':
            newState = {...newState, 
                geojsoncounter: (1 + state.geojsoncounter), 
                areaproperties: action.areaproperties, 
                geometries: action.geometries, 
                active: action.active };
            return newState;

        case 'SET_EDITABLEGEOMETRYCODES':
            newState = {...newState, editablegeometrycodes: action.editablegeometrycodes};
            return newState;

        case 'RESET_EDITABLEGEOMETRYCODES':
            newState = {...newState, editablegeometrycodes: initialStateMap.editablegeometrycodes};
            return newState;
    
        case 'REDRAW_GEOJSON':
            newState = {...newState, geojsoncounter: (1 + state.geojsoncounter)};
            return newState;

        case 'SET_SELECTED':
            newState = {...newState, selected: action.selected};
            return newState;

        case 'RESET_SELECTED':
            newState = {...newState, selected: initialStateMap.selected};
            return newState;

        case 'ADD_SELECTED':
            if (!newState.selected.includes(action.selected)) {
                let selected = newState.selected;
                selected.push(action.selected);
                newState = {...newState, selected: selected};
            }
            return newState;

        case 'DELETE_SELECTED':
            if (newState.selected.includes(action.selected)) {
                let selected = newState.selected;
                selected.splice(selected.indexOf(action.selected), 1);
                newState = {...newState, selected: selected};
            }
            return newState;

        default:
            return state;
    }
}
