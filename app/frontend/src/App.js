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
import { v4 as uuidv4 } from 'uuid';
import { isMobile } from './service/checkScreenSize';
import CarbonMapApp from "./reducers";

import 'react-tooltip/dist/react-tooltip.css'
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
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
/* Theme variables */
import './theme/variables.css';
import './theme/app.css';
import BasicPage from "./views/BasicPage/BasicPage";
import DatasetsPage from "./views/DatasetsPage/DatasetsPage";
// import Login from './views/BasicPage/Login';
import { loadReCaptcha } from 'react-recaptcha-google'

import { setupIonicReact } from '@ionic/react';
import { POSITIVE_SITE } from './constants';

require('./App.css');

setupIonicReact({
  mode: 'md'
});

let store = createStore(CarbonMapApp, applyMiddleware(thunk));


/**
 * Main template class for App 
 */
class App extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired,
  };

  constructor(props) {
    super(props);

    const { cookies } = props;
    const cookieexpiry = new Date(new Date().setFullYear(new Date().getFullYear() + 2));
    let positivecookie = (cookies.get('positiveplaces') || '');
    if (positivecookie === '') {
      positivecookie = uuidv4();
    }
    cookies.set('positiveplaces', positivecookie, { path: '/', expires: cookieexpiry});

    this.state = {
      isMobile: false,
      positivecookie: positivecookie,
    };
  }

  componentDidMount() {
    loadReCaptcha();    
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }

  resize() {
    if (this.state.isMobile !== isMobile(window.innerWidth)) {
      this.setState({'isMobile': isMobile(window.innerWidth)});
    }
  }

  componentWillUnmount() {
      window.removeEventListener("resize", this.resize.bind(this));
  }  

  render() {
    document.title = POSITIVE_SITE.name;
    return (
      <Provider store={store}>
        <BrowserRouter>
          <Switch>
            {/* <Route exact path="/login" render={(props) => (<Login isMobile={this.state.isMobile} />)} /> */}
            <Route exact path="/datasets" render={(props) => (<DatasetsPage positivecookie={this.state.positivecookie} isMobile={this.state.isMobile} />)} />
            <Route path="/" render={(props) => (<BasicPage positivecookie={this.state.positivecookie} isMobile={this.state.isMobile} />)} />
          </Switch>
        </BrowserRouter>
      </Provider>
    )
  }
}

export default withCookies(App);
