import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import DesktopDrawer from './DesktopDrawer';
import MobileDrawer from './MobileDrawer';
import './Drawer.css'

export class Drawer extends Component {

  render() {
    return (
      <>
      {this.props.global.drawer && !this.props.global.searching ? (
        <>
          {this.props.isMobile ? 
          (<MobileDrawer isMobile={this.props.isMobile} />) : 
          (<DesktopDrawer isMobile={this.props.isMobile} />)}
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Drawer));
