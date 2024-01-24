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
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { IonApp, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonText } from '@ionic/react';
import Toolbar from './../../components/toolbar';
import { POSITIVE_SITE } from '../../constants';

class DatasetsPage extends Component {

  constructor(props) {
    super(props);
    this.datasets = require('../../constants/datasets.json');
  }

  render() {
    return (
      <IonApp>
        <IonHeader>
          <IonToolbar className="toolbar">
                <div className="toolbar-content">
                    <IonTitle className="toolbar-title">
                        <div className="toolbar-icon-name">
                            <a href="/"><img width="120" alt={POSITIVE_SITE.name} title={POSITIVE_SITE.name} className="positive-logo" src={ "/static/assets/media/" + POSITIVE_SITE.shortcode + ".png"} /></a>
                            <span className="toolbar-icon-title">
                                {this.props.global.context ? this.props.global.context.name: null}
                            </span>
                        </div>
                    </IonTitle>
                </div>
            </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonGrid>
              <IonRow class="ion-align-items-left ion-justify-content-left">
                <IonCol size="auto">
                  <IonText><h1>Datasets used</h1> [<a style={{color: "black"}} href="/static/datasets.json" target="_download">Download list as JSON</a>]
                  </IonText>
                </IonCol>
              </IonRow>

              <table id="datasets" style={{border: "1px black"}}>
                <thead>
                  <tr>
                    <th align="left">Topic</th>
                    <th align="left">Feature</th>
                    <th align="left">Area</th>
                    <th align="left">URL</th>
                    <th align="left">Licence</th>
                  </tr>
                </thead>
              <tbody>
                {this.datasets.map((dataset, index) => (
                  <tr key={index}>
                    <td style={{whiteSpace: "nowrap"}}><IonText>{dataset.topic}</IonText></td>
                    <td><IonText>{dataset.feature}</IonText></td>
                    <td><IonText>{dataset.area}</IonText></td>
                    <td><IonText><a target="_dataset" href={dataset.dataseturl}>{dataset.dataseturl}</a></IonText></td>
                    <td><IonText><a target="_licence" href={dataset.licenceurl}>{dataset.licence}</a></IonText></td>
                  </tr>
                ))} 
              </tbody>
              </table>

          </IonGrid>
        </IonContent>
      </IonApp>
    )
  }
}

export const mapStateToProps = state => {
  return {
    global: state.global,
    auth: state.auth,
    map: state.map,
  }
}
  
export const mapDispatchToProps = dispatch => {
return {
    setGlobalState: (globalstate) => {
        return dispatch(global.setGlobalState(globalstate));
    },  
}
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DatasetsPage));
