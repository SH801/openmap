import React, { Component } from 'react';
import { IonIcon, IonText } from '@ionic/react'
import { chevronDown } from 'ionicons/icons'; 

export class DataAccordion extends Component {

    state = {
      maxHeight: "0vh",
    }

    openAccordion = () => {
        if(this.state.maxHeight === "0vh") {
          this.setState({'maxHeight': '100vh'});
        } else {
          this.setState({'maxHeight': '0vh'});
        };
    };

    render () {
      return (
        <div className="ion-padding data-accordion">
          <div
            className="ion-justify-content-between accordion-title-container"
            onClick={() => this.openAccordion()}
          >
            <IonText className="accordion-title">
              <span className="accordion-title-bold">{this.props.titleData} </span>
              {this.props.title}
            </IonText>
            <IonIcon
              className="ion-align-self-center"
              icon={chevronDown}
              color="black"
            />
          </div>
          <div
            className="bottom-view-container"
            style={{
              maxHeight: this.state.maxHeight,
              transitionDuration: "1s",
              overflow: "hidden",
            }}
          >
            {this.props.bottomView}
          </div>
        </div>
      );
    }
};

export default DataAccordion;