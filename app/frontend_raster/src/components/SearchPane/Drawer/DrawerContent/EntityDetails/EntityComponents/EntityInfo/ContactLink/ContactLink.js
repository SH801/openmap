import React, { Component }  from 'react';
import { IonText } from '@ionic/react'

export class ContactLink extends Component {

  render() {
    return (
      <a
        href={this.props.href}
        target="_blank"
        rel="noreferrer"
        style={{
          display: "flex",
          flexDirection: "row",
          marginRight: 24,
          textDecoration: "none",
        }}
      >
        <img
          src={`/static/assets/icon/linkIcons/${this.props.src}`}
          style={{ width: 16, height: 16, marginRight: 8 }}
          alt={this.props.alt}
        />
        <IonText style={{ color: "black" }}>{this.props.text}</IonText>
      </a>
    );
  };
}

export default ContactLink;