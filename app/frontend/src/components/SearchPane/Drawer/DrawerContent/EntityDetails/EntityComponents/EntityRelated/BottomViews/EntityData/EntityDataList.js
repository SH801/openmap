import React, { Component } from "react";
import { IonText } from '@ionic/react';
import EntityData from './EntityData';

export class EntityDataList extends Component {

    render() {
        return (
            <>
                {this.props.data.length > 0 ?
                    <div className="ion-margin-top accordion-post-list">
                        {this.props.data.map((data, index) => {
                            return <EntityData key={index} data={data} />
                        })}
                    </div>
                :
                    <IonText>No data available</IonText>
                }
            </>
        );
    }
};

export default EntityDataList;