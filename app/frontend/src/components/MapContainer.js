import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { global, search } from "../actions";
import { Map, Popup, NavigationControl, GeolocateControl }  from 'react-map-gl/maplibre';
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
    var popup = this.popupRef.current;

    if (event.features.length > 0) {

      var featureState = map.getFeatureState(event.features[0]);
      if (featureState['invisible'] === true) return;

      if (this.hoveredPolygonId === null) {
        map.getCanvas().style.cursor = 'pointer';
        this.hoveredPolygonId = event.features[0].id;
        map.setFeatureState(
          { source: 'positivefarms', sourceLayer: 'positivefarms', id: this.hoveredPolygonId },
          { hover: true }
        );

        var featurecentroid = centroid(event.features[0]);
        var description = event.features[0].properties.entityname;
        popup.setLngLat(featurecentroid.geometry.coordinates).setHTML(description).addTo(map);
      }  
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
      this.hoveredPolygonId = null;
      map.getCanvas().style.cursor = '';
      popup.remove();  
    }
  }

  onClick = (event) => {
    if (event.features.length > 0) {

      var map = this.mapRef.current.getMap();
      var featureState = map.getFeatureState(event.features[0]);
      if (featureState['invisible'] === true) return;

      var entityid = event.features[0].properties.entityid;
      this.selectEntity(entityid);
    }
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
          onMouseLeave={this.onMouseLeave}
          onMoveEnd={this.onMoveEnd}
          onClick={this.onClick}
          minZoom={5}
          maxBounds={this.getMaxBounds()}
          interactiveLayerIds={['positivefarms_background', 'positivefarms_active']}
          initialViewState={{
            longitude: this.state.lng,
            latitude: this.state.lat,
            zoom: this.state.zoom,
            pitch: this.state.pitch,
            bearing: this.state.bearing
          }}    
          mapStyle={require('../constants/mapstyletest.json')}
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
