import React, { Component }  from 'react';
import { IonText } from '@ionic/react';
import { Tooltip } from 'react-tooltip';

export class EntityActionsList extends Component {

  iconForActionType = (actionType) => {
    if (actionType) {
      return `/static/assets/icon/actionIcons/coloured/${actionType}.png`;
    } else {
      return "/static/assets/icon/actionIcons/environment.png";
    }
  };

  render () {
    return (
      <>
        {this.props.actions.length > 0 ? (
          <>
          <Tooltip id="action-tooltip" />
          {this.props.singlerow === true ? (
            <div>
              {this.props.actions.map((action, index) => {
                return (
                    <img
                        data-tooltip-id="action-tooltip" 
                        data-tooltip-content={action.name} 
                        key={index}
                        className="disableSave" 
                        onContextMenu={(e) => {e.preventDefault();}} 
                        alt={action.name}
                        onClick={() => this.props.selectProperty(action)}
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
                  <IonText key={index}
                    onClick={() => this.props.selectProperty(action)}
                    className="entity-action"
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
                      className="disableSave" 
                      onContextMenu={(e) => {e.preventDefault();}} 
                      style={{
                        width: 40,
                        height: 40,
                        marginRight: 8,
                      }}
                    />
                    <p>{action.name}</p>
                  </IonText>
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
