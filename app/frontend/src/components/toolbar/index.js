import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { IonTitle, IonToolbar } from '@ionic/react';
import { global } from "../../actions";
import Share from './share';
import LoginPopover from './LoginPopover/LoginPopover';
// import HelpBtn from './HelpBtn/HelpBtn';

export class Toolbar extends Component {

    render() {
        return (
            <IonToolbar className="toolbar">
                <div className="toolbar-content">
                    <IonTitle className="toolbar-title">
                        <div className="toolbar-icon-name">
                            <a href="/"><img width="120" alt="Positive Farms" title="Positive Farms" className="positivefarms-logo" src="/static/assets/media/logo-positivefarms-black.png"/></a>
                            <span className="toolbar-icon-title">
                                {this.props.global.context ? this.props.global.context.name: null}
                            </span>
                        </div>
                    </IonTitle>
                    <div className="icon-container">
                        {/* <HelpBtn /> */}
                        <Share />
                        <LoginPopover />
                    </div>
                </div>
            </IonToolbar>
        );
    }
};


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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Toolbar));
