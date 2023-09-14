import React, { Component }  from 'react';
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
            <IonIcon onClick={this.showShare} icon={shareSocialOutline} className="share-icon"/>
            <IonModal 
                id="share-modal"
                isOpen={this.state.showsharemodal} 
                onWillDismiss={(ev) => this.onWillDismiss(ev)} 
            >
                <IonHeader>
                    <IonToolbar>
                        <IonButtons slot="start">
                            <IonButton onClick={() => this.onWillDismiss()}>Close</IonButton>
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

export default Share;
