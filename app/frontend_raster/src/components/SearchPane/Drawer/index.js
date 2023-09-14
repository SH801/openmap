import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { withSizes } from 'react-sizes'
import { mapSizesToProps } from "../../../service/checkScreenSize";
import DesktopDrawer from './DesktopDrawer';
import MobileDrawer from './MobileDrawer';
import './Drawer.css'

export class Drawer extends Component {

  render() {
    return (
      <>
      {this.props.global.drawer && !this.props.global.searching ? (
        <>
          {this.props.isMobile ? (<MobileDrawer />) : (<DesktopDrawer />)}
        </>
      ) : null}
      </>
    );
  }
}

export const mapStateToProps = state => {
  return {
    global: state.global,
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

export default withSizes(mapSizesToProps)(withRouter(connect(mapStateToProps, mapDispatchToProps)(Drawer)));
