import React, { Component }  from 'react';
import { IonText } from '@ionic/react';


export class EntityPost extends Component {

    state = {
        maxHeight: "0vh",
    };

    togglePostDisplay = () => {
        if(this.state.maxHeight === "0vh") {
            this.setState({'maxHeight': "100vh"});
        } else {
            this.setState({'maxHeight': "0vh"});
        };
    };

    formatDate(date) {
        let newdate = new Date(date);
        return newdate.toLocaleDateString("en-UK");
    }

    render() {
        return (
            <div className="accordion-post" style={{ borderBottom: '1px solid black' }}>
                <div className="accordion-post-title ion-justify-content-between ion-padding-vertical">
                    <IonText onClick={() => this.togglePostDisplay()} className="accordion-title-bold">
                        <div dangerouslySetInnerHTML={{__html: this.props.title}} />
                    </IonText>
                    <IonText>{this.formatDate(this.props.date)}</IonText>
                </div>
                <div className="accordion-post-text-container" style={{ maxHeight: this.state.maxHeight, overflow: 'hidden', transitionDuration: '1s' }}>
                    <IonText className="accordion-post-text">
                        <div dangerouslySetInnerHTML={{__html: this.props.text}} />
                    </IonText>
                </div>
            </div>
        );
    }
}

export default EntityPost;