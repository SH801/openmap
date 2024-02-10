import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { global, search } from "../../../actions";
import { 
    addCircle, 
    addCircleOutline, 
    create, 
    createOutline, 
    shapes, 
    shapesOutline, 
    speedometer, 
    speedometerOutline, 
    flash,
    flashOutline,
    closeOutline } from 'ionicons/icons';
import { 
    IonIcon,
    IonModal, 
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonContent, 
    IonTitle,
    IonItem,
    IonText,
    IonList,
} from '@ionic/react';
import { getBoundingBox, mapRefreshPlanningConstraints, mapRefreshWindspeed, mapRefreshElectricity } from '../../../functions/map';
import { convertMapDraw2GeoJSON } from '../../../functions/mapdraw';

export class NewAsset extends Component {

    state = {
        shownewassetmodal: false,
    }

    showNewAssetSelector = () => {
        if (this.props.global.editcustomgeojson === null) this.setState({shownewassetmodal: true});
    }

    showMapdraw = (assettype) => {
        // if (!(this.props.global.showplanningconstraints)) this.togglePlanningRestrictions();

        if (!this.props.isMobile) {
            var customentity = {
                name: 'Your renewables',
                customgeojson: this.props.global.customgeojson
              }
    
              this.props.setGlobalState({'drawer': true, 'searching': false, entities: {entities: [customentity]}});
              this.props.resetGeosearch();
              this.props.setSearchText(customentity.name);                
        }

        if (this.props.global.mapref !== null) {
            var map = this.props.global.mapref.current.getMap();
            map.addControl(this.props.global.mapdraw, this.props.isMobile ? 'top-right' : 'top-left'); 
            this._map = map;      
            // Update customgeojson after every change
            this._map.on('draw.create', (e) => {
                var customgeojson = convertMapDraw2GeoJSON(this.props.global.mapdraw.getAll());
                this.props.setGlobalState({customgeojson: customgeojson});        
            });
            this._map.on('draw.delete', (e) => {
                var customgeojson = convertMapDraw2GeoJSON(this.props.global.mapdraw.getAll());
                this.props.setGlobalState({customgeojson: customgeojson});        
            });
            this._map.on('draw.update', (e) => {
                var customgeojson = convertMapDraw2GeoJSON(this.props.global.mapdraw.getAll());
                this.props.setGlobalState({customgeojson: customgeojson});        
            });
            map._mapdraw = this.props.global.mapdraw;
            this.props.global.mapdraw.set(this.props.global.customgeojson);
            if (assettype === 'edit') {
                if (this.props.global.customgeojson.features.length > 0) {
                    var overallboundingbox = getBoundingBox(this.props.global.customgeojson);
                    this.props.setGlobalState({fittingbounds: true});
                    map.fitBounds(overallboundingbox, {
                        animate: true,
                        padding: {top: 50, bottom:10, left: 50, right: 50}
                    });
                }
            }
            map.setLayoutProperty('customgeojson_windturbine', 'visibility', 'none');
            map.setLayoutProperty('customgeojson_solarfarm', 'visibility', 'none');
            document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl');                      
            document.getElementsByClassName('mapboxgl-ctrl-group')[0].classList.add('maplibregl-ctrl-group');  
            if (assettype === 'solar') {
                this.props.global.mapdraw.changeMode('draw_polygon');    
                map.on('draw.create', function (e) {
                    setTimeout(() => {this._mapdraw.changeMode('draw_polygon')}, 500);
                });                        
            }
            if (assettype === 'wind') {
                this.props.global.mapdraw.changeMode('draw_point');    
                map.on('draw.create', function (e) {
                    setTimeout(() => {this._mapdraw.changeMode('draw_point')}, 500);
                });                        
            }
        }
    }

    enableEdit = () => {
        if (this.props.global.editcustomgeojson === null) {
            this.showMapdraw('edit');
            this.props.setGlobalState({editcustomgeojson: 'edit'});
        }
    }

    selectWind = () => {
        console.log("selectWind");
        this.props.setGlobalState({editcustomgeojson: 'wind'});
        this.showMapdraw('wind');        
        this.closeModal();
    }

    selectSolar = () => {
        console.log("selectSolar");
        this.props.setGlobalState({editcustomgeojson: 'solar'});
        this.showMapdraw('solar');        
        this.closeModal();
    }

    togglePlanningRestrictions = () => {
        var map = this.props.global.mapref.current.getMap();
        if (this.props.global.showplanningconstraints) map.removeControl(this.props.global.grid);
        else {
            map.addControl(this.props.global.grid);
            map.setZoom(map.getZoom() + 0.001);
        }
        this.props.setGlobalState({showplanningconstraints: !(this.props.global.showplanningconstraints)}).then(() => {
            mapRefreshPlanningConstraints(
                this.props.global.showplanningconstraints, 
                this.props.global.planningconstraints,
                map);          
        });
    }

    toggleWindspeed = () => {
        var map = this.props.global.mapref.current.getMap();
        this.props.setGlobalState({showwindspeed: !(this.props.global.showwindspeed)}).then(() => {
            mapRefreshWindspeed(this.props.global.showwindspeed, map);          
        });
    }

    toggleElectricity = () => {
        var map = this.props.global.mapref.current.getMap();
        this.props.setGlobalState({showelectricity: !(this.props.global.showelectricity)}).then(() => {
            mapRefreshElectricity(this.props.global.showelectricity, map);          
        });
    }

    closeModal = () => {
        this.setState({shownewassetmodal: false});
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    render() {
        return (
            <>
            <div className="toolbar-button-container" onClick={this.showNewAssetSelector}>
                <IonIcon icon={((this.props.global.editcustomgeojson === 'wind') || (this.props.global.editcustomgeojson === 'solar')) ? addCircle: addCircleOutline} title="Add renewables" className="editcustomgeojson-icon toolbar-button"/>
                <div className="toolbar-button-caption">Add</div>
            </div>
            {this.props.global.customgeojson.features.length > 0 ? (
                <div className="toolbar-button-container" onClick={this.enableEdit}>
                    <IonIcon data-tooltip-id="actions-tooltip" title="Edit renewables" icon={(this.props.global.editcustomgeojson === 'edit') ? create: createOutline} className="editcustomgeojson-icon toolbar-button"/>
                    <div className="toolbar-button-caption">Edit</div>
                </div>
            ) : null}
             <div className="toolbar-button-container" onClick={this.togglePlanningRestrictions}>           
                <IonIcon title="Toggle site constraints" slot="icon-only" icon={this.props.global.showplanningconstraints ? shapes: shapesOutline} className="editcustomgeojson-icon toolbar-button"/>
                <div className="toolbar-button-caption">Siting</div>
            </div>
            <div className="toolbar-button-container" onClick={this.toggleWindspeed} >
                <IonIcon title="View wind speed heatmap" slot="icon-only" icon={this.props.global.showwindspeed ? speedometer: speedometerOutline} className="editcustomgeojson-icon toolbar-button"/>
                <div className="toolbar-button-caption">
                    
                {this.props.global.showwindspeed ? (
                    <><b style={{fontSize: "125%", textTransform:"none"}}>{this.props.global.windspeed} m/s</b> {(this.props.global.windspeed < 5) ? " - TOO LOW": null}</>
                ) : (<>Wind</>)}            
                    
                </div>
            </div>
            <div className="toolbar-button-container" onClick={this.toggleElectricity} >
                <IonIcon title="Toggle electricity grid layer" slot="icon-only" icon={this.props.global.showelectricity ? flash: flashOutline} className="editcustomgeojson-icon toolbar-button"/>
                <div className="toolbar-button-caption">Grid</div>
            </div>
            {this.state.shownewassetmodal ? (
                <IonModal 
                    id="newasset-modal"
                    isOpen={this.state.shownewassetmodal} 
                    onWillDismiss={(ev) => this.onWillDismiss(ev)} 
                >
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonIcon onClick={() => this.onWillDismiss()} icon={closeOutline} className="close-icon"/>
                            </IonButtons>
                            <IonTitle className="message-title">Select wind / solar</IonTitle>
                        </IonToolbar>
                    </IonHeader>
                    <IonContent className="ion-padding">
                        <IonList>
                            <IonItem onClick={this.selectWind} className="ion-no-padding" lines="none" style={{cursor: "default", paddingLeft: "10px"}}>
                                <img alt="Wind turbine" src="/static/assets/icon/actionIcons/coloured/windturbine.png" style={{width: "100px"}} />Wind turbine
                            </IonItem>
                            <IonItem onClick={this.selectSolar} className="ion-no-padding" lines="none" style={{cursor: "default", paddingTop: "10px", paddingLeft: "10px"}}>
                                <img alt="Solar panels" src="/static/assets/icon/actionIcons/coloured/solarpanel.png" style={{width: "80px", marginLeft: "10px", marginRight: "10px"}} /><IonText>Solar panels</IonText>
                            </IonItem>
                        </IonList>
                    </IonContent>
                </IonModal>
            ) : null}
            </>
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
      resetGeosearch: () => {
        return dispatch(search.resetGeosearch());
      },                  
  }
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NewAsset));
