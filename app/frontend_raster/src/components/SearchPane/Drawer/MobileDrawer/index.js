import React, { Component }  from 'react';
import { IonModal } from "@ionic/react";
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { withSizes } from 'react-sizes'
import { mapSizesToProps } from '../../../../service/checkScreenSize';
import DrawerContent from "../DrawerContent";

export class MobileDrawer extends Component {

  modalSubject = <DrawerContent />;

  render() {
    return (
      <div>
        <IonModal
          style={{ display: "block" }}
          isOpen={true}
          canDismiss={true}
          breakpoints={[0.05, 0.4, 0.95]}
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

export default withSizes(mapSizesToProps)(withRouter(connect(mapStateToProps, mapDispatchToProps)(MobileDrawer)));