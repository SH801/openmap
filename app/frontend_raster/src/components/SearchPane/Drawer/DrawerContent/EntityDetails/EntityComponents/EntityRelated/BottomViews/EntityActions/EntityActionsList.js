import React, { Component }  from 'react';
import { IonText } from '@ionic/react';

export class EntityActionsList extends Component {

  iconForActionType = (actionType) => {
    if (actionType) {
      return `/static/assets/icon/actionIcons/${actionType}.png`;
    } else {
      return "/static/assets/icon/actionIcons/environment.png";
    }
  };

  onClick = (action) => {
    if (this.props.onClick) {
      this.props.onClick(action);
    }
  }

  render () {
    return (
      <>
        {this.props.actions.length > 0 ? (
          <>
          {this.props.singlerow === true ? (
            <div>
              {this.props.actions.map((action, index) => {
                return (
                    <img
                      key={index}
                      alt={action.name}
                      title={action.name}
                      onClick={() => this.onClick(action)}
                      src={this.iconForActionType(action.icon)}
                      style={{
                        width: 35,
                        height: 35,
                        marginRight: 8,
                      }}
                    />
                );
              })}
            </div>
          ) : (
            <div>
            <div><b>What they're doing...</b></div>
            <ul className="ion-margin-top" style={{ paddingLeft: 8 }}>
              {this.props.actions.map((action, index) => {
                return (
                  <a
                    key={index}
                    href={action.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      textDecoration: "none",
                      alignItems: "center",
                    }}
                  >
                    <img
                      alt={action.name}
                      title={action.name}
                      src={this.iconForActionType(action.icon)}
                      style={{
                        width: 40,
                        height: 40,
                        marginRight: 8,
                      }}
                    />
                    <p>{action.name}</p>
                  </a>
                );
              })}
            </ul>
            </div>  
          )}

          </>
        ) : (
          <IonText>
          </IonText>
        )}
      </>
    );
  }

};

export default EntityActionsList;