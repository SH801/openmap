import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { global, search } from "../../../../../actions";
import EntityInfo from './EntityComponents/EntityInfo/EntityInfo';
import EntityRelated from './EntityComponents/EntityRelated/EntityRelated';
import { mapSelectProperty } from '../../../../../functions/map';

export class EntityDetails extends Component {

  getTransform = () => {
    const mobileMenuStyle = this.props.global.drawer ? "translateY(0vh)" : "translateY(42vh)";
    const desktopMenuStyle = this.props.global.drawer ? "translateX(0%)" : "translateX(100%)";

    return this.props.isMobile ? mobileMenuStyle : desktopMenuStyle;
  }

  getResultsSummary = (count) => {
    if (count === 0) return "No results found...";
    if (count === 1) return "1 result found";
    return count.toString() + " results found";
  }

  selectProperty = (property) => {
    if (this.props.global.mapref) {
      mapSelectProperty(this.props.global.context, this.props.global.mapref.current.getMap(), property['id']);
    }
    this.props.setSearchText(property['name']);
    this.props.fetchSearchResults(property['name']);
    this.props.setGeosearch(property['id']);
    this.props.fetchEntitiesByProperty(property['id'], this.props.isMobile);    
  }

  render () {
    return (
      <div
        className="entity-details-container"
        style={{
          transform: this.getTransform(),
          marginTop: this.props.isMobile ? '35px': '30px',
        }}
      >
          <>
          {this.props.global.entities.entities ? (
            <>
            {this.props.global.entities.list ? (
              <>
              <h1 style={{color: "orange"}}>{this.getResultsSummary(this.props.global.entities.numresults)}</h1>
              {this.props.global.entities.numresults > 25 ? (
                <h2>Showing nearest 25</h2>
              ) : null}
              </>
            ) : null }

            {this.props.global.entities.entities.map((entity, index) => {
              return(
                <div key={index}>
                  <EntityInfo 
                    isMobile={this.props.isMobile} 
                    entity={entity} 
                    selectProperty={this.selectProperty} 
                  />
                  {!this.props.global.entities.list ? (
                    <EntityRelated 
                      isMobile={this.props.isMobile} 
                      key={index} 
                      entity={entity} 
                      selectProperty={this.selectProperty} 
                    />
                  ) : null}
                </div>
              );
            })}
            </>
          ) : null }
          </>

      </div>
    );  
  }
};

export const mapStateToProps = state => {
  return {
    global: state.global,
    auth: state.auth,
    map: state.map,
    search: state.search,
  }
}
  
export const mapDispatchToProps = dispatch => {
return {
    setGlobalState: (globalstate) => {
        return dispatch(global.setGlobalState(globalstate));
    },  
    setSearchText: (searchtext) => {
      return dispatch(search.setSearchText(searchtext));
    },      
    fetchSearchResults: (searchtext) => {
      return dispatch(search.fetchSearchResults(searchtext));
    },      
    resetSearch: () => {
      return dispatch(search.resetSearch());
    },      
    resetSearchResults: () => {
      return dispatch(search.resetSearchResults());
    },      
    fetchEntity: (id, isMobile) => {
      return dispatch(global.fetchEntity(id, isMobile));
    },   
    setGeosearch: (geosearch) => {
      return dispatch(search.setGeosearch(geosearch));
    },      
    resetGeosearch: () => {
      return dispatch(search.resetGeosearch());
    },      
    fetchEntitiesByProperty: (propertyid, isMobile) => {
      return dispatch(global.fetchEntitiesByProperty(propertyid, isMobile));
    },      
    resetEntities: () => {
      return dispatch(global.resetEntities());
    }, 
}
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EntityDetails));
