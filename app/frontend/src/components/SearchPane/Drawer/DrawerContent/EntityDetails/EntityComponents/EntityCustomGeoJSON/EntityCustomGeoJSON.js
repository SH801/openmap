import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { IonText } from '@ionic/react';
import { area } from '@turf/turf';
import { global } from "../../../../../../../actions";

export class EntityCustomGeoJSON extends Component {

  runcalculations = (customgeojson) => {

    var numsolar = 0;
    var numwind = 0;
    var areasolar = 0;
    for(let i = 0; i < customgeojson.features.length; i++) {
      if (customgeojson.features[i].properties.subtype === 'wind') numwind++;
      if (customgeojson.features[i].properties.subtype === 'solar') {
        numsolar++;
        areasolar += parseFloat(area(customgeojson.features[i]) / 10000);
      }
    }

    // 2 hectares per MW - see https://www.nfuonline.com/archive?treeid=21480
    var powerperhectare = 0.5;
    var powersolar = (areasolar * powerperhectare);

    // 1 MWh from gas generates 0.36 metric tons as conservative estimate - see 
    // https://www.quora.com/How-much-carbon-dioxide-is-emitted-into-the-atmosphere-by-the-burning-of-natural-gas-to-produce-1-MW-h-of-energy
    var emissionssaved = powersolar * 0.36 * 24 * 365

    return {
      numwind: numwind,
      numsolar: numsolar,
      areasolar: areasolar,
      powersolar: powersolar,
      emissionssaved: emissionssaved
    }
  }

  convertForDisplay = (value) => {
    var retvalue = parseFloat(value).toLocaleString('en', {minimumFractionDigits: 1,maximumFractionDigits: 1});
    return retvalue;
  }

  render() {

    let calculations = this.runcalculations(this.props.entity.customgeojson);

    return (
      <div>
          <div>
            <div className="entity-identification-details">
              <div>
                <div className="entity-title-container">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      marginBottom: 8,
                    }}
                  >
                    <div className="entity-title-customgeojson">
                      <IonText className="ion-text-capitalize ion-text-left entity-title-customgeojson">
                        {this.props.entity.name} 
                      </IonText>
                    </div>                    

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                        Wind turbines: <strong>{calculations.numwind}</strong>
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                        Solar farms: <strong>{calculations.numsolar}</strong>
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                        Solar area: <strong>{this.convertForDisplay(calculations.areasolar)} hectares</strong>
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                        Estimated solar power: <strong>{this.convertForDisplay(calculations.powersolar)} MW</strong>
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                        Potential CO<sub>2</sub> reduction (solar): <strong>{this.convertForDisplay(calculations.emissionssaved)} tonnes per year</strong>
                      </IonText>                      
                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>
      </div>
    );
    }
}


export const mapStateToProps = state => {
  return {
    global: state.global
  }
}
  
export const mapDispatchToProps = dispatch => {
return {
    setGlobalState: (globalstate) => {
        return dispatch(global.setGlobalState(globalstate));
    },  
}
}  

export default connect(mapStateToProps, mapDispatchToProps)(EntityCustomGeoJSON);