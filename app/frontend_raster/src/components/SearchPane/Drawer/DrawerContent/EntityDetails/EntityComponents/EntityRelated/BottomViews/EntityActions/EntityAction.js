import React, { Component }  from 'react';

export class EntityAction extends Component {

  render() {
    return (
      <a
        href={this.props.action.link}
        target="_blank"
        rel="noreferrer"
        style={{ color: "#000", textDecoration: "none" }}
      >
        <li>{this.props.action.title}</li>
      </a>
    );
  }
};

export default EntityAction;