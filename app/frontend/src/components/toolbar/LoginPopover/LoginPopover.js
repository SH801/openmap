import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
// import { Link } from 'react-router-dom';
import { personCircleOutline } from 'ionicons/icons';
import { IonIcon } from "@ionic/react";
import { global, auth } from '../../../actions';
import '../toolbar.css';


export class LoginPopover extends Component {

  state = {
    showLoginDialog: true,
    showLoginPopover: {
      showPopover: false,
      event: undefined,  
    }    
  };

  logout = (e) => {
    this.props.logout();
    this.setState({showLoginPopover: { showPopover: false, event: undefined }});
  }

  render() {
    return (
      <div>
        <a href="/account/">
          <IonIcon icon={personCircleOutline} className="login-icon"/>
        </a>
        {/* <IonIcon
          icon={personCircleOutline}
          className="login-icon"
          onClick={(e) => {
            e.persist();
            this.setState({showLoginPopover: { showPopover: true, event: e }});
          }}
        />
        <IonPopover
          event={this.state.showLoginPopover.event}
          isOpen={this.state.showLoginPopover.showPopover}
          onDidDismiss={() =>
            this.setState({showLoginPopover: { showPopover: false, event: undefined }})
          }
          showBackdrop={false}
        >
          {this.props.auth.isAuthenticated ? (
            <div className="addOrgLink" onClick={this.logout}>
              <IonIcon
                icon={lockClosedOutline}
                color="primary"
                style={{ fontSize: 24, marginRight: 8 }}
              />
              <IonText color="primary">Logout</IonText>
            </div>
          ) : (
            <Link to={"/login/" + this.props.location.search} className="addOrgLink">
            <IonIcon
              icon={lockOpenOutline}
              color="primary"
              style={{ fontSize: 24, marginRight: 8 }}
            />
            <IonText color="primary">Login</IonText>
          </Link>

          )}

        </IonPopover>
 */}
      </div>
    );
  
  }
};

export const mapStateToProps = state => {
  return {
    global: state.global,
    auth: state.auth,
  }
}
  
export const mapDispatchToProps = dispatch => {
return {
    setGlobalState: (globalstate) => {
        return dispatch(global.setGlobalState(globalstate));
    },  
    logout: () => {
      return dispatch(auth.logout());
  },  
}
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(LoginPopover));
