import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { global, map } from "../../actions";
import LoginPopover from './LoginPopover/LoginPopover';
// import HelpBtn from './HelpBtn/HelpBtn';

export class Toolbar extends Component {

    addEntity = () => {
        this.props.setGlobalState({'editentity': -1, 'drawer': true}); 
        this.props.enterMapEdit([]); 
    }

    render() {
        return (
            <IonToolbar className="toolbar" color="primary">
                <div className="toolbar-content">
                    <IonTitle className="toolbar-title">
                        <div className="toolbar-icon-name">
                            <a href="/"><img width="200" alt="Future Farms" className="futurefarms-logo" src="/static/assets/media/logo-futurefarms2.png"/></a>
                            <span className="toolbar-icon-title">
                                {this.props.global.context ? this.props.global.context.name: null}
                            </span>
                        </div>
                    </IonTitle>
                    <div className="icon-container">
                        {this.props.auth.isAuthenticated ? (
                           <IonButton color="success" onClick={() => this.addEntity()}>Add farm</IonButton>
                        ) : null }
                        {/* <HelpBtn /> */}
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
      enterMapEdit: (editablegeometrycodes) => {
        return dispatch(map.enterMapEdit(editablegeometrycodes));
      },  
  }
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Toolbar));
