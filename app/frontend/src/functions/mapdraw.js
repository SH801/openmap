

export function convertMapDraw2GeoJSON(customgeojson) {
    customgeojson = JSON.parse(JSON.stringify(customgeojson));
    var outputfeatures = [];
    var postfeatures = [];
    // Add turbines to end of GeoJSON featurecollection to ensure they overwrite solar farms when rendering
    for(let i = 0; i < customgeojson.features.length; i++) {
      if (customgeojson.features[i].geometry.type === 'Point') {
        customgeojson.features[i].properties = {
          type: 'custom', 
          subtype: 'wind', 
          name: 'Manually-added wind turbine'
        };
        // Weird anomaly where MapbowDraw sometimes adds point with no coordinates
        if (customgeojson.features[i].geometry.coordinates.length === 2) postfeatures.push(customgeojson.features[i]);
      } else {
        customgeojson.features[i].properties = {
          type: 'custom', 
          subtype: 'solar', 
          name: 'Manually-added solar farm'
        };
        // Weird anomaly where MapbowDraw sometimes adds point with no coordinates
        console.log(customgeojson.features[i].geometry.coordinates[0]);
        if (customgeojson.features[i].geometry.coordinates[0].length > 2) outputfeatures.push(customgeojson.features[i]);
      }
    }
    for(let i = 0; i < postfeatures.length; i++) outputfeatures.push(postfeatures[i]);
    customgeojson = {type: 'FeatureCollection', features: outputfeatures};
    console.log(customgeojson);
    return customgeojson;
}
