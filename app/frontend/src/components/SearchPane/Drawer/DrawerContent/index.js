import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import EntityDetails from './EntityDetails/EntityDetails';

export class DrawerContent extends Component {
    
    render() {
        return (
            <EntityDetails isMobile={this.props.isMobile} />
        )
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
