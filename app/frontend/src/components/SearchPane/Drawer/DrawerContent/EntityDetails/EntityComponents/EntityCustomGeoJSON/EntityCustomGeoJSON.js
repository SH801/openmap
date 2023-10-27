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
    // Actual valued calculating using all OSM solar assets through tools.py 'computerenewablesareas'
    var powerperhectare = 0.5591341813229055;
    var powersolar = (areasolar * powerperhectare);

    // 1 MWh from gas generates 0.36 metric tons as conservative estimate - see 
    // https://www.quora.com/How-much-carbon-dioxide-is-emitted-into-the-atmosphere-by-the-burning-of-natural-gas-to-produce-1-MW-h-of-energy
    var emissionssaved = powersolar * 0.36 * 24 * 365

    // Estimated cost of solar 0.6m per MW - see https://www.pfnexus.com/blog/starting-a-solar-farm
    var estimatedsolarcost = (0.6 * powersolar)

    // Estimated ROI 10% - 20% per year - see https://www.pfnexus.com/blog/starting-a-solar-farm
    var estimatedsolarreturnmin = 0.1 * estimatedsolarcost;
    var estimatedsolarreturnmax = 0.2 * estimatedsolarcost;

    return {
      numwind: numwind,
      numsolar: numsolar,
      areasolar: areasolar,
      powersolar: powersolar,
      emissionssaved: emissionssaved,
      estimatedsolarcost: estimatedsolarcost,
      estimatedsolarreturnmin: estimatedsolarreturnmin,
      estimatedsolarreturnmax: estimatedsolarreturnmax
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
                        <strong>Wind turbines: </strong>{calculations.numwind}
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                      <strong>Solar farms: </strong>{calculations.numsolar}
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                      <strong>Solar area: </strong>{this.convertForDisplay(calculations.areasolar)} hectares
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                      <strong>Solar power: </strong>{this.convertForDisplay(calculations.powersolar)} MW
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                      <strong>CO<sub>2</sub> reduction (solar): </strong>{this.convertForDisplay(calculations.emissionssaved)} tonnes / year
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                      <strong>Capital cost (solar): </strong> > £{this.convertForDisplay(calculations.estimatedsolarcost)}M<sup><a target="_new" href="https://www.pfnexus.com/blog/starting-a-solar-farm">1</a></sup>
                      </IonText>                      
                    </div>


                    <div className="entity-item-customgeojson">
                      <IonText className="ion-text-left">
                      <strong>Return (solar): </strong> £{this.convertForDisplay(calculations.estimatedsolarreturnmin)} - £{this.convertForDisplay(calculations.estimatedsolarreturnmax)} M / year<sup><a target="_new" href="https://www.pfnexus.com/blog/starting-a-solar-farm">1</a></sup>
                      </IonText>                      
                    </div>

                    <div className="entity-item-customgeojson-note">
                      <IonText className="ion-text-left">
                        <i>Note:</i> Aside from asset numbers above, all figures are broad estimates. Users should consult an experienced renewables expert or organisation to obtain accurate figures that reflect current market pricing and specific site conditions.
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