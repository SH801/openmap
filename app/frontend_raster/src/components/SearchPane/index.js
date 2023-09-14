import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { withSizes } from 'react-sizes'
import { mapSizesToProps } from '../../service/checkScreenSize';
import SearchBar from './SearchBar';
import Drawer from './Drawer';

export class SearchPane extends Component {

  render() {

    return (
      <div
        className="ion-align-self-end menu-container"
        style={{
          backgroundColor: this.props.global.drawer && !this.props.isMobile ? "#fff" : "transparent",
          pointerEvents: this.props.global.drawer && !this.props.isMobile ? "auto" : "none"}}
      >
        {!this.props.global.editentity ? (
          <SearchBar />
        ) : null}
        <Drawer />
      </div>
    )
  }
}

export const mapStateToProps = state => {
  return {
    global: state.global,
  }
}

export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
          return dispatch(global.setGlobalState(globalstate));
      },  
  }
}  

export default withSizes(mapSizesToProps)(withRouter(connect(mapStateToProps, mapDispatchToProps)(SearchPane)));

