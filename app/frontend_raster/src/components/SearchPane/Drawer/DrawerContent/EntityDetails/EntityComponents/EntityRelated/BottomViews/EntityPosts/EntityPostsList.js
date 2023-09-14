import React, { Component } from "react";
import { IonText } from '@ionic/react';
import EntityPost from './EntityPost';

export class EntityPostsList extends Component {

    render() {
        return (
            <>
                {this.props.posts.length > 0 ?
                    <div className="ion-margin-top accordion-post-list">
                        {this.props.posts.map((post, index) => {
                            return (
                                <EntityPost 
                                    key={index}
                                    title={post.title}
                                    text={post.text}
                                    date={post.date}
                                />
                            )
                        })}
                    </div>
                :
                    <IonText>No posts available</IonText>
                }
            </>
        );
    }
};

export default EntityPostsList;