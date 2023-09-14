import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
// import BusinessTypeEntities from './BusinessTypeEntities/BusinessTypeEntities';
import EntityDetails from './EntityDetails/EntityDetails';

//                {props.entitiesByBusinessType.length > 0 ?
//                     <BusinessTypeEntities 
//                         entitiesByBusinessType={props.entitiesByBusinessType}
//                     />
//                 :}

export class DrawerContent extends Component {

    render() {
        return <EntityDetails />;
    };
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DrawerContent));
