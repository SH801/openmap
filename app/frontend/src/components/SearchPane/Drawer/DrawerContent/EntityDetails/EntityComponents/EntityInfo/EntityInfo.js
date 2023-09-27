import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { IonText, IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import { global, search } from "../../../../../../../actions";
import { getEntityActions, getEntityBusinessTypes } from  "../../../../../../../functions/properties"
import ContactLink from "./ContactLink/ContactLink";
import EntityContact from "../../EntityContact";
import EntityActionsList from '../EntityRelated/BottomViews/EntityActions/EntityActionsList';
import { mapSelectEntity } from '../../../../../../../functions/map';

export class EntityInfo extends Component {

  DESC_MORE = "100vh";
  DESC_LESS = "8vh";

  state = {
    descHeight:   this.DESC_LESS,
    seeMoreText:  "more",
    contactModal: false,
  }

  handleReadMore = () => {
    if (this.state.descHeight !== this.DESC_MORE) {
      this.setState({descHeight: this.DESC_MORE, seeMoreText: 'less'});
    } else {
      this.setState({descHeight: this.DESC_LESS, seeMoreText: 'more'});
    }
  };

  nameGo = (id) => {
    for(let i = 0; i < this.props.global.entities.entities.length; i++) {
      let entity = this.props.global.entities.entities[i];
      if (entity.id === id) {    
        this.props.resetGeosearch();
        this.props.setSearchText(entity['name']);
        this.props.fetchSearchResults(entity['name']);    
        this.props.fetchEntity(id, this.props.isMobile);
        if (this.props.global.mapref) {
          var map = this.props.global.mapref.current.getMap();
          mapSelectEntity(this.props.global.context, map, id);
        }       
        break;
      }
    }
  }

  contactEntity = (entity) => {
    this.props.setGlobalState({showcontactmodal: true})
  }

  propertyClassName = (propertyText) => {
    propertyText = propertyText.toLowerCase();
    propertyText = propertyText.replaceAll(" ", "-");
    return "entity-" + propertyText;
  }

  extrapropertyPrettify = (extrapropertyText) => {
    extrapropertyText = extrapropertyText.replaceAll(":", " ");
    extrapropertyText = extrapropertyText[0].toUpperCase() + extrapropertyText.slice(1)
    return extrapropertyText;
  }

  render() {

    let isEmpty = false;
    if ((this.props.entity.desc === undefined) || (this.props.entity.desc.length < 60)) {
      isEmpty = true;
    }

    return (
      <div>
        <EntityContact 
          isOpen={this.props.global.showcontactmodal} 
          entity={this.props.entity}
        />
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

                    </div>

                    <div>
                        {this.props.entity.distance ? (
                        <IonText className="entity-distance">{this.props.entity.distance} {this.props.entity.distance === 1 ? ("mile"):("miles")}</IonText>
                        ) : null }
                    </div>
                    
                    {this.props.entity.address ? (
                      <IonText className="ion-text-capitalize entity-address">
                        {this.props.entity.address}
                      </IonText>                      
                    ) : null }

                  </div>
                </div>

                <div className="entity-business-types" style={{ width: this.props.isMobile ? "95vw" : "100%"}}>
                    {getEntityBusinessTypes(this.props.entity).map((property, index) => {
                      return (
                        <div key={index} className="tablist-container">
                        <IonText 
                          onClick={() => this.props.selectProperty(property)}
                          className={"ion-text-capitalize entity-business-type " + this.propertyClassName(property.name)}
                        >
                          <span className="tablist-tab">
                          {property.name}
                          </span>
                        </IonText>  
                        </div>  
                      )
                    })}
                </div>

                {(!this.props.global.entities.list && this.props.entity.extraproperties) ? (
                  <>
                    {Object.keys(this.props.entity.extraproperties).map((extraproperty, index) => {
                      return (
                        <div key={index}>
                          <IonText className="entity-extraproperties">
                            <b>{this.extrapropertyPrettify(extraproperty)}</b>: {this.props.entity.extraproperties[extraproperty]}
                          </IonText>                      
                        </div>
                      )
                    })}
                  </>
                ) : null }

                {this.props.global.entities.list ? (
                  <EntityActionsList 
                    actions={getEntityActions(this.props.entity)} 
                    singlerow={true} 
                    selectProperty={this.props.selectProperty} 
                  />
                ) : null}


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
                      {this.props.entity.contactable ? (
                        <ContactLink
                          src="friends.png"
                          alt="Send message to farm"
                          text="Connect"
                          onClick={() => this.contactEntity(this.props.entity)}
                        />
                      ) : null} 
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
}
}  

export default connect(mapStateToProps, mapDispatchToProps)(EntityInfo);