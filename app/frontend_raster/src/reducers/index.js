/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/index.js 
 * 
 * React redux reducers index
 */ 

import { combineReducers } from 'redux';
import global from "./global";
import auth from "./auth";
import map from "./map";
import areas from "./areas";
import search from "./search";
import mobileReducer from "./isMobile";

const CarbonMapApp = combineReducers({
  global,
  auth,
  map,
  areas,
  search,
  mobileReducer
})

export default CarbonMapApp;