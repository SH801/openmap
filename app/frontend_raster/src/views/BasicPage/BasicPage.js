/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * BasicPage.js
 * 
 * Default page
 */ 

import React, { Component } from 'react';
import { IonApp, IonHeader } from '@ionic/react';
import SearchPane from './../../components/SearchPane';
import Map from './../../components/Map';
import Toolbar from './../../components/toolbar';
// import Map from './components/map.js';
// import Map from '../../test/map';

class BasicPage extends Component {

  render() {
    return (
      <IonApp>
        <IonHeader>
          <Toolbar />
        </IonHeader>
        <div style={{ height: "100vh", position: "relative" }}>
            <div style={{ height: "100%" }}>
              <SearchPane />
              <Map />
            </div>
        </div>
      </IonApp>
    )
  }
}

export default BasicPage;
