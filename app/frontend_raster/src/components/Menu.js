/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Menu.js 
 * 
 * Menu element of Open Carbon Map
 * 
 * Contains a location search box and a geographical region selector (LAU1/MSOA-IG/LSOA-DZ)
 * Number of regions that can be selected will depend on current zoom level according to values ZOOM_SHOWLEVEL_2 and ZOOM_SHOWLEVEL_3
 * Number of available regions will appear as a number above the layers icon
 */ 

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { global, map } from "../actions";
import { withRouter } from 'react-router';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import SearchIcon from '@material-ui/icons/Search';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';

export class Menu extends Component {

    constructor(props) {
        super(props);

        this.state = {
            searchfield: '',
        }
    }
        
    submitGeometry = (e) => {
        const newgeometrytype = e.target.value;
        this.props.setGeometry(newgeometrytype, this.props.history, this.props.location).then(() => {
            let areaproperties = this.props.map.areaproperties;
            areaproperties.geometrytype = newgeometrytype;
            this.props.fetchGeometries(areaproperties);            
        });
    }

    searchChange = (e) => {
        this.setState({searchfield: e.target.value});
    }

    submitLocation = (e) => {
        e.preventDefault();
        this.props.gotoLocation(this.state.searchfield);
    }

    render() {

        return (
            <List>
                <ListItem button>
                    <ListItemIcon>
                        <SearchIcon onClick={this.props.onClick}/>
                    </ListItemIcon>
                    <form onSubmit={this.submitLocation} style={{width: "100%"}}>
                        <FormControl fullWidth noValidate autoComplete="off" >
                            <TextField onSubmit={this.submitLocation} id="carbonmap-location" value={this.state.searchfield} onChange={this.searchChange} placeholder="Location / postcode" />
                        </FormControl>
                    </form>
                </ListItem>
            </List>
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
        setGeometry: (geometry, history, location) => {
            return dispatch(global.setGeometry(geometry, history, location));
        },
        fetchGeometries: (areaproperties) => {
            return dispatch(map.fetchGeometries(areaproperties));
        },          
        gotoLocation: (location) => {
            return dispatch(map.gotoLocation(location));
        },          
  }
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Menu));
