import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { global, search } from "../actions";
// @ts-ignore
import { Map, Popup, NavigationControl, GeolocateControl }  from 'react-map-gl/maplibre';
// eslint-disable-next-line import/no-webpack-loader-syntax
// maplibregl.workerClass = require('worker-loader!maplibre-gl/dist/maplibre-gl-csp-worker').default;
import { centroid } from '@turf/turf';
import queryString from "query-string";
import 'maplibre-gl/dist/maplibre-gl.css';
// import './map.css';

import { setURLState, getURLSubdomain, getExternalReference } from "../functions/urlstate";
import { 
  DEFAULT_LAT, 
  DEFAULT_LNG, 
  DEFAULT_ZOOM,
  DEFAULT_PITCH,
  DEFAULT_BEARING,
  AREA_STYLE_CONTEXT,
  DEFAULT_MAXBOUNDS
} from "../constants";
import { mapSelectEntity } from '../functions/map';

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

export class PitchToggle extends Component{
    
  constructor(props) {
    super(props);
    this._pitch = props.pitch;
    this._activated = false;
  }

  onAdd(map) {
    this._map = map;
    let _this = this; 
    this._btn = document.createElement('button');
    this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-3d';
    this._btn.type = 'button';
    this._btn['aria-label'] = 'Toggle Pitch';
    this._btn.onclick = function() { 
        this._activated = !this._activated;
        if (this._activated) {
            map.setStyle(require(isDev() ? '../constants/terrainstyletest.json' : '../constants/terrainstyle.json'));
            map.easeTo({pitch: _this._pitch});
            _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-2d';
        } else {
            map.setStyle(require(isDev() ? '../constants/mapstyletest.json' : '../constants/mapstyle.json'), {diff: false});
            map.easeTo({pitch: 0, bearing: 0});
            _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-3d';
        } 
    };
    
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group test';
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

}

export class MapContainer extends Component  {

  state = {
    context: 0,
    lat: null,
    lng: null,
    zoom: null,
    pitch: null,
    bearing: null,
    subdomain: null,
    scrollWheelZoom: true,	
    area: '',		
    bounds: null,
  }

  hoveredPolygonId = null;

  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.popupRef = React.createRef();

    this.props.fetchAllProperties();
    this.pitchtoggle = new PitchToggle({pitch: 80});

    if (!this.props.global.mapinitialized) {
      let subdomain = getURLSubdomain();
      let externalreference = getExternalReference();
      if (externalreference) {
        this.props.fetchExternalReference(externalreference).then(() => {
          if ((subdomain !== 'localhost') && (subdomain !== 'positivefarms')) {
            this.state.subdomain = subdomain;
            this.props.fetchContext(this.state.subdomain, this.props.isMobile).then(() => {
              this.props.setGlobalState({"mapinitialized": true});
            }) 
          } else {
            this.props.setGlobalState({"mapinitialized": true});
          }      
        })
      } else if ((subdomain !== 'localhost') && (subdomain !== 'positivefarms')) {
        this.state.subdomain = subdomain;
        this.props.fetchContext(this.state.subdomain, this.props.isMobile).then(() => {
          this.props.setGlobalState({"mapinitialized": true});
        }) 
      } else {
        this.props.setGlobalState({"mapinitialized": true});
      }  
    }

    this.state.lat = props.lat;
    this.state.lng = props.lng;
    this.state.zoom = props.zoom;  
    this.state.pitch = props.pitch;
    this.state.bearing = props.bearing;

    let params = queryString.parse(this.props.location.search);
    if (params.lat !== undefined) this.state.lat = params.lat;
    if (params.lng !== undefined) this.state.lng = params.lng;
    if (params.zoom !== undefined) this.state.zoom = params.zoom;  
    if (params.pitch !== undefined) this.state.pitch = params.pitch;  
    if (params.bearing !== undefined) this.state.bearing = params.bearing;  
  }

  selectEntity = (entityid) => {
    mapSelectEntity(this.props.global.context, this.mapRef.current.getMap(), entityid);
    this.props.setGlobalState({'drawer': true, 'searching': false});
    this.props.resetGeosearch();
    this.props.fetchEntity(entityid, this.props.isMobile).then(() => {
      const entity = this.props.global.entities.entities[0];
      this.props.setSearchText(entity['name']);
      this.props.fetchSearchResults(entity['name']);
    });    
  }

  fetchLastExport = () => {
    this.props.fetchLastExport();
  }

  onLoad = (event) => {
    this.props.setGlobalState({"mapref": this.mapRef}).then(() => {
      setInterval(this.fetchLastExport, 15000);
    });
    var map = this.mapRef.current.getMap();

    map.addControl(this.pitchtoggle, this.props.isMobile ? 'bottom-right' : 'top-left'); 

    var popup = this.popupRef.current;
    popup.remove();  
    
    if (this.props.global.context) {
      // If context set, filter out entities not in context
      map.setFilter('positivefarms_background', 
        ["all", ["in", "'" + this.props.global.context.id.toString() + "'", ["get", "contexts"]]]);
      map.addSource('context', {
        'type': 'geojson',
        'data': this.props.global.context.geojson
      });
      map.addLayer({
        'id': 'context-fill',
        'type': 'fill',
        'source': 'context',
        'layout': {},
        'paint': {
            'fill-color': AREA_STYLE_CONTEXT.fillColor,
            'fill-opacity': AREA_STYLE_CONTEXT.fillOpacity
        }
      });
      map.addLayer({
        'id': 'context-line',
        'type': 'line',
        'source': 'context',
        'layout': {},
        'paint': {
            'line-color': AREA_STYLE_CONTEXT.color,
            'line-opacity': AREA_STYLE_CONTEXT.opacity,
            'line-width': AREA_STYLE_CONTEXT.weight
        }
      });

    }

    if (this.props.global.externalreferencedid) {
      this.props.resetGeosearch();
      this.props.setGlobalState({'drawer': true});
      this.props.fetchEntity(this.props.global.externalreferencedid, this.props.isMobile);
      mapSelectEntity(this.props.global.context, map, this.props.global.externalreferencedid);
    }

  }

  onMouseEnter = (event) => {

    var map = this.mapRef.current.getMap();

    if (event.features.length > 0) {
      if (this.hoveredPolygonId === null) {
        map.getCanvas().style.cursor = 'pointer';
        var properties = event.features[0].properties;
        // Note unique numberical ID required for setFeatureState
        // OSM ids, eg 'way/12345' don't work
        this.hoveredPolygonId = event.features[0].id;
        map.setFeatureState(
          { source: 'positivefarms', sourceLayer: 'positivefarms', id: this.hoveredPolygonId },
          { hover: true }
        );
        map.setFeatureState(
          { source: 'renewables', sourceLayer: 'renewables', id: this.hoveredPolygonId },
          { hover: true }
        );

        var featurecentroid = centroid(event.features[0]);
        var description = properties.name;
        if (description === undefined) {
          description = "No name available";
          var source = "";
          if (properties['plant:source'] !== undefined) source = properties['plant:source'];
          if (properties['generator:source'] !== undefined) source = properties['generator:source'];
          if (source === "solar") description = "Solar Farm";
          if (source === "wind") description = "Wind Farm";
        }
        this.setState({'showpopup': true});
        var popup = this.popupRef.current;
        popup.setLngLat(featurecentroid.geometry.coordinates).setHTML(description).addTo(map);
      }  
    }
  }

  onMouseMove = (event) => {
    if (this.hoveredPolygonId) {
      var popup = this.popupRef.current;
      popup.setLngLat(event.lngLat);
    }
  }

  onMouseLeave = (event) => {

    var map = this.mapRef.current.getMap();
    var popup = this.popupRef.current;

    if (this.hoveredPolygonId) {
      map.setFeatureState(
        { source: 'positivefarms', sourceLayer: 'positivefarms', id: this.hoveredPolygonId },
        { hover: false }
      );
      map.setFeatureState(
        { source: 'renewables', sourceLayer: 'renewables', id: this.hoveredPolygonId },
        { hover: false }
      );
      this.hoveredPolygonId = null;
      map.getCanvas().style.cursor = '';
      popup.remove();  
    }
  }

  onClick = (event) => {
    if (event.features.length > 0) {
      var entityid = event.features[0].properties.id;
      this.selectEntity(entityid);
    }
  }

  onResize = (event) => {
    var map = this.mapRef.current.getMap();
    map.removeControl(this.pitchtoggle);
    map.addControl(this.pitchtoggle, this.props.isMobile ? 'bottom-right' : 'top-left'); 
  }

  onMoveEnd = (event) => {

      // Update search results and URL after moving map

      var map = this.mapRef.current.getMap();
      let zoom = map.getZoom();
      let center = map.getCenter();
      let pitch = map.getPitch();
      let bearing = map.getBearing();

      // Refresh search results if geosearch on
      if (this.props.search.geosearch) {
        if ((this.props.search.geosearch !== null) && (this.props.isMobile !== null)) {
          this.props.fetchEntitiesByProperty(this.props.search.geosearch, this.props.isMobile);
        }          
      }

      if (this.props.search.searchtext === '') {
        this.props.fetchSearchResults('');
      }

      setURLState({ 'lat': center.lat, 
                    'lng': center.lng, 
                    'zoom': zoom,
                    'pitch': pitch,
                    'bearing': bearing
                  }, this.props.history, this.props.location);
  }

  getMaxBounds = () => {
    if (this.props.global.context) {
      var bounds = this.props.global.context.bounds;
      // Ideally we'd 'unproject' number of degrees based on zoom size plus pixel padding
      return [[bounds[0] - 0.1, bounds[1] - 0.1], [bounds[2] + (this.props.isMobile? 0.1 : 0.4), bounds[3]+ 0.1]];
    } else {
      return DEFAULT_MAXBOUNDS;
    }
  }

  render () {
    return (
      <>
        {this.props.global.mapinitialized ? (
          <Map ref={this.mapRef}
          onLoad={this.onLoad}
          onMouseEnter={this.onMouseEnter}
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          onMoveEnd={this.onMoveEnd}
          onResize={this.onResize}
          onClick={this.onClick}
          minZoom={4}
          maxBounds={this.getMaxBounds()}
          maxPitch={85}
          terrain={{source: "terrainSource", exaggeration: 1.1 }}
          interactiveLayerIds={[
            'positivefarms_background', 
            'positivefarms_active', 
            'renewables_background',
            'renewables_active'
          ]}
          initialViewState={{
            longitude: this.state.lng,
            latitude: this.state.lat,
            zoom: this.state.zoom,
            pitch: this.state.pitch,
            bearing: this.state.bearing
          }}    
          mapStyle={require(isDev() ? '../constants/mapstyletest.json' : '../constants/mapstyle.json')}
        >

          {this.props.isMobile ? (
              <>
              <GeolocateControl position="bottom-right" />
              </>
          ) : (
              <GeolocateControl position="top-left" />
          )}

          {this.props.isMobile ? (
              <>
              <NavigationControl visualizePitch={true} position="bottom-right" />     
              </>
          ) : (
              <NavigationControl visualizePitch={true} position="top-left" />     
          )}

          <Popup longitude={0} latitude={0} ref={this.popupRef} closeButton={false} closeOnClick={false} />

        </Map>
      ) : null};
      </>
    )
  }
}

MapContainer.defaultProps = {
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  zoom: DEFAULT_ZOOM,
  pitch: DEFAULT_PITCH,
  bearing: DEFAULT_BEARING
};
  
  
export const mapStateToProps = state => {
    return {
      global: state.global,
      map: state.map,
      areas: state.areas,
      search: state.search,
    }
}
      
export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
        return dispatch(global.setGlobalState(globalstate));
      },  
      setSearchText: (searchtext) => {
        return dispatch(search.setSearchText(searchtext));
      },      
      fetchLastExport: () => {
        return dispatch(global.fetchLastExport());
      },  
      fetchAllProperties: () => {
        return dispatch(global.fetchAllProperties());
      },  
      fetchEntitiesByProperty: (propertyid, isMobile) => {
        return dispatch(global.fetchEntitiesByProperty(propertyid, isMobile));
      },    
      fetchSearchResults: (searchtext) => {
        return dispatch(search.fetchSearchResults(searchtext));
      },        
      fetchContext: (context, isMobile) => {
        return dispatch(global.fetchContext(context, isMobile));
      },  
      fetchExternalReference: (externalreference) => {
        return dispatch(global.fetchExternalReference(externalreference));
      },  
      fetchEntity: (id, isMobile) => {
        return dispatch(global.fetchEntity(id, isMobile));
      },        
      resetGeosearch: () => {
        return dispatch(search.resetGeosearch());
      },                  
  }
}  
  
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(MapContainer));
