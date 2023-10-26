import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { global } from "../../../actions";
import { Tooltip } from 'react-tooltip';
import { addCircleOutline, createOutline, closeOutline } from 'ionicons/icons';
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
import { getBoundingBox } from '../../../functions/map';

export class NewAsset extends Component {

    state = {
        shownewassetmodal: false,
    }

    showNewAssetSelector = () => {
        if (this.props.global.editcustomgeojson === null) this.setState({shownewassetmodal: true});
    }

    showMapdraw = (assettype) => {
        if (this.props.global.mapref !== null) {
            var map = this.props.global.mapref.current.getMap();
            map.addControl(this.props.global.mapdraw, this.props.isMobile ? 'top-right' : 'top-left'); 
            map._mapdraw = this.props.global.mapdraw;
            this.props.global.mapdraw.set(this.props.global.customgeojson);
            if (assettype === 'edit') {
                if (this.props.global.customgeojson.features.length > 0) {
                    var overallboundingbox = getBoundingBox(this.props.global.customgeojson);
                    map.fitBounds(overallboundingbox, {animate: false, padding: 100});
                }
            }
            map.getSource("customgeojson").setData({type: "FeatureCollection", features: []});
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

    closeModal = () => {
        this.setState({shownewassetmodal: false});
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    render() {
        return (
            <>
            <Tooltip id="actions-tooltip" place="left" variant="light" style={{fontSize: "100%", zIndex: 1000}} />
            <IonIcon data-tooltip-id="actions-tooltip" data-tooltip-content="Add wind/solar" onClick={this.showNewAssetSelector} icon={addCircleOutline} className="editcustomgeojson-icon"/>
            {this.props.global.customgeojson.features.length > 0 ? (
                <IonIcon data-tooltip-id="actions-tooltip" data-tooltip-content="Edit wind/solar" onClick={this.enableEdit} icon={createOutline} className="editcustomgeojson-icon"/>
            ) : null}
            {this.state.shownewassetmodal ? (
                <IonModal 
                    id="newasset-modal"
                    isOpen={this.state.shownewassetmodal} 
                    onWillDismiss={(ev) => this.onWillDismiss(ev)} 
                >
                    <IonHeader>
                        <IonToolbar>
                            <IonButtons slot="start">
                                <IonIcon onClick={() => this.onWillDismiss()} icon={closeOutline} className="editcustomgeojson-icon"/>
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
    }
}
    
export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
          return dispatch(global.setGlobalState(globalstate));
      },  
  }
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(NewAsset));
