import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { nanoid } from 'nanoid';
import queryString from "query-string";
import { closeOutline } from 'ionicons/icons';
import { global } from "../../actions";
import { modifyURLParameter } from "../../functions/urlstate";

import { shareSocialOutline } from 'ionicons/icons';
import { 
    IonIcon,
    IonModal, 
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonTitle,
    IonItem,
    IonLabel,
    IonTextarea,
    IonList,
} from '@ionic/react'
import './toolbar.css';


export class Share extends Component {

    state = {
        showsharemodal: false,
        link: ''
    }

    copyToClipboard = () => {
        navigator.clipboard.writeText(this.state.link);
    }

    showShare = () => {
        // If customgeojson, create shareable link
        if (this.props.global.customgeojson.features.length > 0) {
            var shortcode = nanoid();
            let params = queryString.parse(this.props.location.search);
            if (params.plan === undefined) {        
                this.props.updateCustomGeoJSON('', shortcode, this.props.global.customgeojson);
                modifyURLParameter({plan: shortcode}, this.props.history, this.props.location);
            } else shortcode = params.plan;            
        }

        this.setState({link: window.location.href, showsharemodal: true});
    }

    closeModal = () => {
        this.setState({link: '', showsharemodal: false});
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    render() {
        return (
            <>
            <div>
                <IonIcon onClick={this.showShare} icon={shareSocialOutline} className="share-icon toolbar-button"/>
                <div className="toolbar-button-caption">Share</div>
            </div>
            <IonModal 
                id="share-modal"
                isOpen={this.state.showsharemodal} 
                onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            >
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonIcon onClick={() => this.onWillDismiss()} icon={closeOutline} className="close-icon"/>
                        </IonButtons>
                        <IonTitle className="message-title">Shareable link</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                    <IonList>
                        <IonItem className="ion-no-padding" lines="none">
                            <IonLabel position="stacked">Shareable link</IonLabel>
                            <IonTextarea name="link" value={this.state.link} autoGrow={true} type="text" />
                        </IonItem>
                        <IonItem className="ion-no-padding" lines="none">
                            <IonButton onClick={() => this.copyToClipboard()}>Copy to clipboard</IonButton>
                        </IonItem>
                    </IonList>
                </IonContent>
            </IonModal>        
            </>
        );
    }
};

export const mapStateToProps = state => {
    return {
      global: state.global,
    }
}
      
export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
        return dispatch(global.setGlobalState(globalstate));
      },  
      updateCustomGeoJSON: (cookie, shortcode, customgeojson) => {
        return dispatch(global.updateCustomGeoJSON(cookie, shortcode, customgeojson));
      },      
  }
}  
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Share));