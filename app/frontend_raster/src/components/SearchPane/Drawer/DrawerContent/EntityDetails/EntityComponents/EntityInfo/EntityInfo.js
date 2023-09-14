import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withSizes } from 'react-sizes'
import { IonText, IonIcon } from '@ionic/react';
import 'draft-js/dist/Draft.css';
import { createOutline, arrowForwardOutline } from 'ionicons/icons';
import { mapSizesToProps } from '../../../../../../../service/checkScreenSize';
import { global, map, search } from "../../../../../../../actions";
import { getEntityActions, getEntityBusinessTypes } from  "../../../../../../../functions/properties"
import ContactLink from "./ContactLink/ContactLink";
import EntityActionsList from '../EntityRelated/BottomViews/EntityActions/EntityActionsList';

export class EntityInfo extends Component {

  DESC_MORE = "100vh";
  DESC_LESS = "8vh";

  state = {
    descHeight:   this.DESC_LESS,
    seeMoreText:  "more",
  }

  handleReadMore = () => {
    if (this.state.descHeight !== this.DESC_MORE) {
      this.setState({descHeight: this.DESC_MORE, seeMoreText: 'less'});
    } else {
      this.setState({descHeight: this.DESC_LESS, seeMoreText: 'more'});
    }
  };

  selectProperty = (property) => {
    this.props.setSearchText(property['name']);
    this.props.fetchSearchResults(property['name']);
    this.props.setGeosearch(property['id']);
    this.props.fetchEntitiesByProperty(property['id'], this.props.isMobile).then(() => {
      this.props.redrawGeoJSON();
    });    
  }

  nameClicked = (id) => {
    // User clicked on entity name
    for(let i = 0; i < this.props.global.entities.entities.length; i++) {
      let entity = this.props.global.entities.entities[i];
      if ((entity.id === id) && (entity.bounds !== undefined)) {    
        const southWest = [entity.bounds[1], entity.bounds[0]]
        const northEast = [entity.bounds[3], entity.bounds[2]]
        this.props.global.map.fitBounds([southWest, northEast], {
          paddingBottomRight: this.props.isMobile ? [0, 0] : [220, 0],
          animate: true,
        });  
        break;
      }
    }
  }

  nameGo = (id) => {
    for(let i = 0; i < this.props.global.entities.entities.length; i++) {
      let entity = this.props.global.entities.entities[i];
      if (entity.id === id) {    
        this.props.resetGeosearch();
        this.props.setSearchText(entity['name']);
        this.props.fetchSearchResults(entity['name']);    
        this.props.fetchEntity(id, this.props.isMobile).then(() => {
          this.props.redrawGeoJSON();
        });    

        break;
      }
    }
  }

  toggleEdit = (entityid) => {
    this.props.setGlobalState({'editentity': entityid}); 
    this.props.enterMapEdit(this.props.entity.geometrycodes); 
  }

  
  render() {

    let isEmpty = false;
    if ((this.props.entity.desc === undefined) || (this.props.entity.desc.length < 60)) {
      isEmpty = true;
    }

    return (
      <div>
          <div>
            <div className="entity-identification-details">
              <div>
                <div className="entity-title-container">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      marginBottom: 8,
                    }}
                  >
                    {(!this.props.global.entities.list &&  
                        this.props.entity.img && 
                        (this.props.entity.img.length !== 0)) ? (
                          <div>
                            <img
                                alt={this.props.entity.name}
                                className="entity-img"
                                src={this.props.entity.img}
                              />
                          </div>
                      ) : null}
                    <div className="entity-title">
                      <IonText 
                        className="ion-text-capitalize ion-text-left entity-title"
                        onClick={() => this.nameGo(this.props.entity.id)}
                      >
                        {this.props.entity.name} 
                        {this.props.global.entities.list ? (
                          <IonIcon icon={arrowForwardOutline} className="entity-activate"/>
                        ) : null}
                      </IonText>

                      {this.props.auth.isAuthenticated && 
                      !this.props.global.entities.list ? (
                          <IonIcon onClick={() => this.toggleEdit(this.props.entity.id)} icon={createOutline} className="entity-edit"/>
                        ) : null}
                    </div>

                    <IonText className="ion-text-capitalize entity-address">
                      {this.props.entity.address}
                    </IonText>                      

                  </div>
                  <div className="entity-business-types">
                    {getEntityBusinessTypes(this.props.entity).map((property, index) => {
                      return (
                          <IonText key={index}
                            onClick={() => this.selectProperty(property)}
                            className="ion-text-capitalize entity-business-type"
                          >
                          {property.name}
                        </IonText>
                      )
                      })}
                    </div>
                    {this.props.global.entities.list ? (
                      <EntityActionsList actions={getEntityActions(this.props.entity)} singlerow={true} onClick={this.selectProperty} />
                    ) : null}
                </div>
                {!this.props.global.entities.list ? (
                    <div className="connect-link-container">
                      {this.props.entity.website ? (
                        <ContactLink
                          src="link.png"
                          alt="Link Icon"
                          text="Website"
                          href={this.props.entity.website}
                        />
                      ) : null}
                      <ContactLink
                        src="friends.png"
                        alt="Connect Icon"
                        text="Connect"
                        href={`mailto:info@futurefarms.online?subject=Please introduce me to ${this.props.entity.name}&body=Thank you!`}
                      />
                    </div>  
                ) : null}
              </div>
            </div>
            {this.props.global.entities.list ? (
              <div></div>
            ) : (
              <div
                className="entity-desc-container"
                onClick={() => this.handleReadMore()}
              >
                <div
                  className="entity-desc-text-container"
                  style={{
                    maxHeight: this.state.descHeight,
                    transitionDuration: "1s",
                    marginBottom: "4vh",
                  }}
                >
                  <IonText className="entity-desc">
                    <div dangerouslySetInnerHTML={{__html: this.props.entity.desc}} />
                  </IonText>
                  {isEmpty ? null : (                  
                    <div
                      className="entity-desc-readmore-container"
                      style={{
                        bottom: this.state.descHeight === "8vh" ? "-4vh" : "-4vh",
                        transitionDuration: "1s",
                        height: this.state.descHeight === "8vh" ? "140%" : "0%",
                      }}
                      >                    
                      <IonText color="primary" className="entity-desc-readmore">
                        See {this.state.seeMoreText}...
                      </IonText>
                    </div>
                    )}
                </div>
              </div>  
            )}
          </div>
      </div>
    );
    }
}


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
    enterMapEdit: (editablegeometrycodes) => {
      return dispatch(map.enterMapEdit(editablegeometrycodes));
    },
    redrawGeoJSON: () => {
      return dispatch(map.redrawGeoJSON());
    },
}
}  

export default withSizes(mapSizesToProps)(connect(mapStateToProps, mapDispatchToProps)(EntityInfo));