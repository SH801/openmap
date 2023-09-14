/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * App.js
 * 
 * App pulls together menu, map, context sliders, selected areas, and graphs for main Open Carbon Map page
 */ 

import React, { Component } from 'react';
import { Route, Switch, BrowserRouter } from 'react-router-dom';
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";

import CarbonMapApp from "./reducers";

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
/* Theme variables */
import './theme/variables.css';
import './theme/app.css';
import BasicPage from "./views/BasicPage/BasicPage";
// import Login from "./application/components/Login";
import Login from './views/BasicPage/Login';

import { setupIonicReact } from '@ionic/react';

require('./App.css');

setupIonicReact({
  mode: 'md'
});

let store = createStore(CarbonMapApp, applyMiddleware(thunk));


/**
 * Main template class for App 
 */
class App extends Component {

  render() {
    return (

      <Provider store={store}>
        <BrowserRouter>
          <Switch>
            <Route exact path="/login" component={Login} />
            <Route path="/" component={BasicPage} />
          </Switch>
        </BrowserRouter>
      </Provider>
    )
  }
}

export default App;
