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
import MapContainer from '../../components/MapContainer';
import Toolbar from './../../components/toolbar';

class BasicPage extends Component {

  render() {
    return (
      <IonApp>
        <IonHeader>
          <Toolbar />
        </IonHeader>
        <div style={{ height: "100vh", position: "relative" }}>
            <div style={{ height: "100%" }}>
              <SearchPane isMobile={this.props.isMobile} />
              <MapContainer isMobile={this.props.isMobile} />
            </div>
        </div>
      </IonApp>
    )
  }
}

export default BasicPage;
