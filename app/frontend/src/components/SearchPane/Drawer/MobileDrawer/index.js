import React, { Component }  from 'react';
import { IonModal } from "@ionic/react";
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import DrawerContent from "../DrawerContent";

export class MobileDrawer extends Component {

  onTouchMove = (event) => {
    event.stopPropagation();
    return false;
  }

  modalSubject = <div onTouchMove={this.onTouchMove} onTouchMoveCapture={this.onTouchMove} ><DrawerContent isMobile={this.props.isMobile} /></div>;

  render() {
    return (
      <div>
        <IonModal
          id="drawer"
          style={{ display: "block" }}
          isOpen={true}
          canDismiss={true}
          breakpoints={[0.1, 0.4, 0.95]}
          initialBreakpoint={0.4}
          backdropBreakpoint={0.4}
          className="bottom-sheet"
          showBackdrop={true}
          backdropDismiss={false}
          children={this.modalSubject}
        />
      </div>
    );
  }
};

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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MobileDrawer));