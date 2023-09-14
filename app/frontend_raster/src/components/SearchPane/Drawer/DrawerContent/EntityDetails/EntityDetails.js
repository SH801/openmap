import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { withSizes } from 'react-sizes'
import { NEW_ENTITY } from '../../../../../constants';
import { mapSizesToProps } from '../../../../../service/checkScreenSize';
import EntityInfo from './EntityComponents/EntityInfo/EntityInfo';
// import RelatedEntities from "./EntityComponents/RelatedEntities/RelatedEntities";
import EntityRelated from './EntityComponents/EntityRelated/EntityRelated';
import EntityEditor from './EntityEditor';

export class EntityDetails extends Component {

  getTransform = () => {
    const mobileMenuStyle = this.props.global.drawer ? "translateY(0vh)" : "translateY(42vh)";
    const desktopMenuStyle = this.props.global.drawer ? "translateX(0%)" : "translateX(100%)";

    return this.props.isMobile ? mobileMenuStyle : desktopMenuStyle;
  }

  getEditedEntity = () => {
    if (this.props.global.editentity === -1) return NEW_ENTITY;
    for(let i = 0; i < this.props.global.entities.entities.length; i++) {
      if (this.props.global.entities.entities[i]['id'] === this.props.global.editentity) {
        return this.props.global.entities.entities[i];
      }
    }
    return NEW_ENTITY;
  }

  getResultsSummary = (count) => {
    if (count === 0) return "No results found...";
    if (count === 1) return "1 result found";
    return count.toString() + " results found";
  }

  render () {
    return (
      <div
        className="entity-details-container"
        style={{
          transform: this.getTransform(),
          marginTop: (this.props.global.editentity | this.props.isMobile) ? '0vh': '6vh',
        }}
      >
        {this.props.global.editentity ? (
          <EntityEditor entity={this.getEditedEntity()} />
        ) : (
          <>
          {this.props.global.entities.entities ? (
            <>
            {this.props.global.entities.list ? (
              <h1 style={{color: "orange"}}>{this.getResultsSummary(this.props.global.entities.entities.length)}</h1>
            ) : null }

            {this.props.global.entities.entities.map((entity, index) => {
              return(
                <div key={index}>
                  <EntityInfo entity={entity} />
                  {!this.props.global.entities.list ? (
                    <EntityRelated key={index} entity={entity} />
                  ) : null}
                </div>
              );
            })}
            </>
          ) : null }
          </>
        )}

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

export default withSizes(mapSizesToProps)(withRouter(connect(mapStateToProps, mapDispatchToProps)(EntityDetails)));
