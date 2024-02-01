import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { IonText, IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { area, center, bbox, point, destination } from '@turf/turf';
import { global } from "../../../../../../../actions";
import { WINDTURBINE_HEIGHT } from "../../../../../../../constants";
export class EntityCustomGeoJSON extends Component {

  selectAsset = (featureindex) => {
    var feature = this.props.global.customgeojson['features'][featureindex];
    var featurebbox = bbox(feature);
    if (feature.properties.subtype === 'wind') {
      var turbineheight = destination(point(feature.geometry.coordinates), (WINDTURBINE_HEIGHT / 1000), 0, {units: 'kilometres'});
      var turbineheightpos = turbineheight.geometry.coordinates;
      featurebbox[3] = turbineheightpos[1];
    }

    if (this.props.global.mapref !== null) {
      var map = this.props.global.mapref.current.getMap();
      const southWest = [featurebbox[0], featurebbox[1]];
      const northEast = [featurebbox[2], featurebbox[3]];
      map.fitBounds([southWest, northEast], {animate: true}); 
    }
  }

  deleteAsset = (ev, featureindex) => {
    ev.stopPropagation();

    if (window.confirm("Are you sure you want to delete that asset?")) {
      var customgeojson = JSON.parse(JSON.stringify(this.props.global.customgeojson));
      customgeojson.features.splice(featureindex, 1);
      if (this.props.global.mapref !== null) {
        var map = this.props.global.mapref.current.getMap();
        map.getSource("customgeojson").setData(customgeojson);
      }
      this.props.setGlobalState({customgeojson: customgeojson}); 
      if (this.props.global.editcustomgeojson !== null) {
        this.props.global.mapdraw.set(customgeojson);
      } 
    }
  }

  runcalculations = (customgeojson) => {

    var numsolar = 0;
    var numwind = 0;
    var areasolar = 0;
    var windassets = [];
    var solarassets = [];
    for(let i = 0; i < customgeojson.features.length; i++) {
      var featurecentre = center(customgeojson.features[i]);
      var west = (parseFloat(featurecentre.geometry.coordinates[0]).toFixed(3).toString()) + "°W";
      var north = (parseFloat(featurecentre.geometry.coordinates[1]).toFixed(3)).toString() + "°N";
      var featuretab = {index: i, coordinates: (north + ", " + west)};
      if (customgeojson.features[i].properties.subtype === 'wind') {
        windassets.push(featuretab);
        numwind++;
      }
      if (customgeojson.features[i].properties.subtype === 'solar') {
        numsolar++;
        solarassets.push(featuretab);
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
      estimatedsolarreturnmax: estimatedsolarreturnmax,
      windassets: windassets,
      solarassets: solarassets
    }
  }

  convertForDisplay = (value) => {
    var retvalue = parseFloat(value).toLocaleString('en', {minimumFractionDigits: 1,maximumFractionDigits: 1});
    return retvalue;
  }

  render() {

    let calculations = this.runcalculations(this.props.global.customgeojson);

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

                    {((calculations.numwind === 0) && (calculations.numsolar === 0)) ? (
                      <div className="entity-item-customgeojson">
                        <IonText className="ion-text-left">
                          No renewables assets added
                        </IonText>                      
                      </div>
                    ): null }

                    {(calculations.numwind>0) ? (
                      <>
                        <div className="entity-item-customgeojson">
                          <IonText className="ion-text-left">
                            <strong>Wind Turbines</strong>
                          </IonText>                      
                        </div>

                        <div className="entity-business-types" style={{ width: this.props.isMobile ? "95vw" : "100%"}}>

                        {(calculations.windassets).map((asset, index) => {
                          return (
                            <div key={index} className="tablist-container">
                            <IonText 
                              onClick={() => this.selectAsset(asset['index'])}
                              className="ion-text-capitalize entity-business-type">
                              <span className="tablist-tab">
                              {asset.coordinates}
                              <IonIcon style={{fontSize: "120%", position: "relative", top: "2px", color: "white"}} onClick={(e) => this.deleteAsset(e, asset['index'])} icon={closeOutline} className="close-icon"/>
                              </span>
                            </IonText> 
                            </div>  
                          )
                        })}

                        </div>
                      </>

                    ): null }

                    {(calculations.numsolar>0) ? (
                      <>
                        <div className="entity-item-customgeojson">
                          <IonText className="ion-text-left">
                            <strong>Solar Farms</strong>
                          </IonText>                      
                        </div>

                        <div className="entity-business-types" style={{ width: this.props.isMobile ? "95vw" : "100%"}}>

                        {(calculations.solarassets).map((asset, index) => {
                          return (
                            <div key={index} className="tablist-container">
                            <IonText 
                              onClick={() => this.selectAsset(asset['index'])}
                              className="ion-text-capitalize entity-business-type">
                              <span className="tablist-tab">
                              {asset.coordinates}
                              <IonIcon style={{fontSize: "120%", position: "relative", top: "2px", color: "white"}} onClick={(e) => this.deleteAsset(e, asset['index'])} icon={closeOutline} className="close-icon"/>
                              </span>
                            </IonText> 
                            </div>  
                          )
                        })}

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
                      </>

                    ): null }


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