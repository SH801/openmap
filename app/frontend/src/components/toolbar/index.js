import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { IonTitle, IonToolbar } from '@ionic/react';
import { POSITIVE_SITE } from '../../constants';
import { global } from "../../actions";
import NewAsset from './NewAsset/NewAsset';
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
                            <a href="/"><img width="120" alt={POSITIVE_SITE.name} title={POSITIVE_SITE.name} className="positive-logo" src={ "/static/assets/media/" + POSITIVE_SITE.shortcode + ".png"} /></a>
                            <span className="toolbar-icon-title">
                                {this.props.global.context ? this.props.global.context.name: null}
                            </span>
                        </div>
                    </IonTitle>
                    <div className="icon-container">
                        {/* <HelpBtn /> */}
                        <NewAsset isMobile={this.props.isMobile} />
                        <Share />
                        {(POSITIVE_SITE.shortcode==='positivefarms') ? (
                        <LoginPopover />
                        ) : null}
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
