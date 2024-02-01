import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { global, search } from "../actions";
import { Tooltip } from 'react-tooltip';
import { Map, Popup, NavigationControl, GeolocateControl }  from 'react-map-gl/maplibre';
import { centroid } from '@turf/turf';
// import { booleanOverlap, bboxPolygon } from '@turf/turf';
import queryString from "query-string";
import 'maplibre-gl/dist/maplibre-gl.css';
// import loadEncoder from 'https://unpkg.com/mp4-h264@1.0.7/build/mp4-encoder.js';
// import { Muxer, ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { closeOutline } from 'ionicons/icons';
// import { IonLoading } from '@ionic/react';
import { 
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonButton, 
  IonText,
  IonAlert
} from '@ionic/react';
import { initShaders, initVertexBuffers, renderImage } from './webgl';
import { setURLState, modifyURLParameter, getURLSubdomain, getExternalReference } from "../functions/urlstate";
import { 
  PLANNING_CONSTRAINTS,
  TILESERVER_BASEURL,
  POSITIVE_SITE,
  POSITIVE_SITES,
  DEFAULT_LAT, 
  DEFAULT_LNG, 
  DEFAULT_ZOOM,
  DEFAULT_PITCH,
  DEFAULT_BEARING,
  AREA_STYLE_CONTEXT,
  MOBILE_PADDING,
  DESKTOP_PADDING,
  DEFAULT_MAXBOUNDS
} from "../constants";
import { getBoundingBox, mapSelectEntity, mapRefreshPlanningConstraints, mapRefreshWindspeed} from '../functions/map';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'

export const isDev = () =>  !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

const ANIMATION_INTERVAL = 800;

export class ExtrusionControl extends Component{
    
  constructor(props) {
      super(props);
      this.options = props.options;
      this._mapcontainer = props.mapcontainer;
  }

  onAdd(map) {
      this._map = map;
      this._extrusionButton = document.createElement('button');
      this._extrusionButton.className = 'maplibregl-ctrl-extrusion';
      this._extrusionButton.type = 'button';
      this._extrusionButton.setAttribute('data-tooltip-id', 'ctrlpanel-tooltip');
      this._extrusionButton.onclick = this._toggleExtrusion;   
      this._ctrlIcon = document.createElement('span');
      this._ctrlIcon.className = 'maplibregl-ctrl-icon';
      this._extrusionButton.appendChild(this._ctrlIcon);
      this._container = document.createElement('div');
      this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
      this._container.appendChild(this._extrusionButton);
      this._updateExtrusionIcon();
      this._map.on('sourcedata', (e) => {if (e.sourceId === 'openmaptiles') {this._updateExtrusionIcon()}});
      this._extrusionButton.onmouseleave = this._onMouseLeave;

      return this._container;
  }

  _onMouseLeave = () => {
    this._mapcontainer.setState({showtooltip: true});
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  _toggleExtrusion = () => {
    this._mapcontainer.setState({showtooltip: false});
    if (this._map.getLayoutProperty("3d-buildings", "visibility") === 'visible') {
      this._map.setLayoutProperty("3d-buildings", 'visibility', 'none');
    } else {
      this._map.setLayoutProperty("3d-buildings", 'visibility', 'visible');
    }
    this._updateExtrusionIcon();
  };
  
  _updateExtrusionIcon = () => {
      this._extrusionButton.classList.remove('maplibregl-ctrl-extrusion');
      this._extrusionButton.classList.remove('maplibregl-ctrl-extrusion-enabled');
      if (this._map.getLayoutProperty("3d-buildings", "visibility") === 'visible') {
          this._extrusionButton.classList.add('maplibregl-ctrl-extrusion-enabled');
          this._extrusionButton.setAttribute('data-tooltip-content', 'Set 3D buildings OFF - better for mobiles');
      } else {
          this._extrusionButton.classList.add('maplibregl-ctrl-extrusion');
          this._extrusionButton.setAttribute('data-tooltip-content', 'Set 3D buildings ON - may slow / cause problems');
      }
  };
}

export class TerrainControl extends Component{
    
  constructor(props) {
      super(props);
      this.options = props.options;
      this._mapcontainer = props.mapcontainer;
  }

  onAdd(map) {
      this._map = map;
      this._terrainButton = document.createElement('button');
      this._terrainButton.className = 'maplibregl-ctrl-terrain';
      this._terrainButton.type = 'button';
      this._terrainButton.setAttribute('data-tooltip-id', 'ctrlpanel-tooltip');
      this._terrainButton.onclick = this._toggleTerrain;   
      this._ctrlIcon = document.createElement('span');
      this._ctrlIcon.className = 'maplibregl-ctrl-icon';
      // this._ctrlIcon.setAttribute('aria-hidden', true);
      this._terrainButton.appendChild(this._ctrlIcon);
      this._container = document.createElement('div');
      this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
      this._container.appendChild(this._terrainButton);
      this._updateTerrainIcon();
      this._map.on('terrain', this._updateTerrainIcon);
      this._terrainButton.onmouseleave = this._onMouseLeave;

      return this._container;
  }

  _onMouseLeave = () => {
    this._mapcontainer.setState({showtooltip: true});
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }

  _toggleTerrain = () => {
    this._mapcontainer.setState({showtooltip: false});
    if (this._mapcontainer.state.terrain) {
      this._mapcontainer.setState({terrain: null}, () => {this._updateTerrainIcon();});
    } else {
      this._mapcontainer.setState({terrain: this.options}, () => {this._updateTerrainIcon();});
    }
  };

  _updateTerrainIcon = () => {
      this._terrainButton.classList.remove('maplibregl-ctrl-terrain');
      this._terrainButton.classList.remove('maplibregl-ctrl-terrain-enabled');
      if (this._mapcontainer.state.terrain) {
          this._terrainButton.classList.add('maplibregl-ctrl-terrain-enabled');
          this._terrainButton.setAttribute('data-tooltip-content', 'Set hills OFF - better for mobiles');
      } else {
          this._terrainButton.classList.add('maplibregl-ctrl-terrain');
          this._terrainButton.setAttribute('data-tooltip-content', 'Set hills ON - may cause mobile problems');
      }
  };
}

export class PitchToggle extends Component{
    
  constructor(props) {
    super(props);
    this._pitch = props.pitch;
    this._mapcontainer = props.mapcontainer;
    this._extrusioncontrol = props.extrusioncontrol;
  }

  onAdd(map) {
    this._map = map;
    let _this = this; 
    this._btn = document.createElement('button');
    if (this._mapcontainer.state.satellite) {
      this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-2d';
    }   
    else {
      this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-3d';
    }
    this._btn.type = 'button';
    this._btn.setAttribute('data-tooltip-id', 'ctrlpanel-tooltip');
    this._btn.setAttribute('data-tooltip-content', 'Toggle between 2D and 3D view');
    this._btn.onmouseleave = function() {_this._mapcontainer.setState({showtooltip: true});}
    this._btn.onclick = function() { 
      var currsatellite = _this._mapcontainer.state.satellite;
      var newsatellite = !currsatellite;
      _this._mapcontainer.setState({showtooltip: false, idle: false, satellite: newsatellite}, () => {
        mapRefreshPlanningConstraints(
          _this._mapcontainer.props.global.showplanningconstraints, 
          _this._mapcontainer.props.global.planningconstraints, 
          _this._map);
        mapRefreshWindspeed(_this._mapcontainer.props.global.showwindspeed, _this._map);
      });
      if (newsatellite) {
          map.easeTo({pitch: _this._pitch});
          _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-2d';
      } else {
          map.easeTo({pitch: 0, bearing: 0});
          _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-pitchtoggle-3d';
      } 
    };
    
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

export class FlyToggle extends Component{
    
  constructor(props) {
    super(props);
    this._mapcontainer = props.mapcontainer;
  }

  onAdd(map) {
    this._map = map;
    this._timer = null;
    let _this = this; 
    this._btn = document.createElement('button');
    this._btn.type = 'button';
    this._btn.setAttribute('data-tooltip-id', 'ctrlpanel-tooltip');
    if (this._mapcontainer.state.flying) {
      this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-flytoggle-landing';
      this._btn.setAttribute('data-tooltip-content', 'Stop flying');
    } else {
      this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-flytoggle-takeoff';
      this._btn.setAttribute('data-tooltip-content', 'Go for a zero-carbon flight');
    }
    this._btn.onmouseleave = function() {_this._mapcontainer.setState({showtooltip: true});}
    this._btn.onclick = function() { 
      var currflying = _this._mapcontainer.state.flying;
      var newflying = !currflying;
      _this._mapcontainer.setState({showtooltip: false});
      _this._mapcontainer.props.setGlobalState({flying: newflying, flyingindex: 0});
      if (newflying) {
        var entities = _this._mapcontainer.props.global.entities;
        console.log(entities);
        var flyingtour = false;
        if (entities) {
          if (entities['list']) {
            _this._mapcontainer.flyingStart();
            _this._mapcontainer.props.startFlyingTour(entities);
            flyingtour = true;
          }
        }
        if (!flyingtour) {
          toast.success('Now flying!');
          _this._mapcontainer.flyingStart();
        }
        this.setAttribute('data-tooltip-content', 'Stop flying');
        _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-flytoggle-landing';
      } else {
        this.setAttribute('data-tooltip-content', 'Go for a zero-carbon flight');
        _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-flytoggle-takeoff';
        _this._mapcontainer.flyingStop();
      } 
    };
    
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    this._container.appendChild(this._btn);

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

export class RecordVideo extends Component{
    
  constructor(props) {
    super(props);
    this._mapcontainer = props.mapcontainer;
    this._encoder = null;
    this._frame = null;
    this._framerate = 30;
    this._timer = null;
  }

  onAdd(map) {
    this._map = map;
    let _this = this; 
    this._btn = document.createElement('button');
    this._btn.type = 'button';
    this._btn.setAttribute('data-tooltip-id', 'ctrlpanel-tooltip');
    if (this._mapcontainer.state.recording) {
      this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-recordvideo-stop';
      this._btn.setAttribute('data-tooltip-content', 'Stop recording video');
    } else {
      this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-recordvideo-start';
      this._btn.setAttribute('data-tooltip-content', 'Start recording video');
    }
    this._btn.onmouseleave = function() {_this._mapcontainer.setState({showtooltip: true});}
    this._btn.onclick = function() { 
      var recording = _this._mapcontainer.state.recording;
      recording = !recording;
      _this._mapcontainer.setState({showtooltip: false, recording: recording})
      // We trigger render after starting/stopping recording in order to show/hide logo
      _this._map._render();
      if (recording) {
        this.setAttribute('data-tooltip-content', 'Stop recording video');
        _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-recordvideo-stop';

        // Use MediaRecorder to record video as it's most efficient
        // Tried using MP4 conversion but too CPU intensive when main app is already working hard
        const canvas = _this._map.getCanvas();
        const data = []; 
        const stream = canvas.captureStream(25); 
        const mediaRecorder = new MediaRecorder(stream);        
        _this._mapcontainer.setState({mediarecorder: mediaRecorder});
        mediaRecorder.ondataavailable = (e) => data.push(e.data);
        mediaRecorder.onstop = (e) => {
    
          const anchor = document.createElement("a");
          anchor.href =  URL.createObjectURL(new Blob(data, {type: "video/webm;codecs=h264"}));
          const now = new Date();
          const timesuffix = now.toISOString().substring(0,19).replaceAll('T', ' ').replaceAll(':', '-');
          anchor.download = POSITIVE_SITE.shortcode + " - " + timesuffix;
          anchor.click();

          // Ideally would like to get post-record-finish MP4 conversion working
          // window.showSaveFilePicker({
          //     suggestedName: `video.mp4`,
          //     types: [{
          //         description: 'Video File',
          //         accept: { 'video/mp4': ['.mp4'] }
          //     }],
          // }).then((fileHandle) => {
          //   fileHandle.createWritable().then((fileStream) => {
          //     let muxer = new Muxer({
          //       target: new FileSystemWritableFileStreamTarget(fileStream),
          //       video: {
          //         codec: 'avc',
          //         width: canvas.width,
          //         height: canvas.height
          //       },
          //     });  
          //     console.log("No of frames", data.length);          
          //     // muxer.addVideoChunkRaw(data, 'delta', 0, 10000, {type: "video/webm;codecs=h264"});
          //     muxer.addVideoChunk(fileBlob); 
          //     muxer.finalize();
          //     fileStream.close().then(() => {
          //       console.log("Finished saving file");
          //     })
          //   });
          // });
        }

        mediaRecorder.start();
        toast.success('Recording started');

        // loadEncoder({ simd: false }).then(Encoder => {
        //   const gl = _this._map.painter.context.gl;
        //   const width = gl.drawingBufferWidth + (gl.drawingBufferWidth % 2 === 0 ? 0: -1);
        //   const height = gl.drawingBufferHeight + (gl.drawingBufferHeight % 2 === 0 ? 0: -1);
  
        //   _this._encoder = Encoder.create({
        //     width,
        //     height,
        //     fps: 5,
        //     kbps: 64000,
        //     speed: 0,
        //     rgbFlipY: true
        //   });
          
        //   const ptr = _this._encoder.getRGBPointer();
        //   let lasttime = performance.now();
        //   let timer = null;

        //   _this._frame = () => {    
        //     const pixels = _this._encoder.memory().subarray(ptr); 
        //     gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels); 
        //     _this._encoder.encodeRGBPointer(); 
        //     // setTimeout(() => {_this._map._render();}, 1000 / _this._encoder.fps);
        //   }
      
        //   _this._map.on('render', _this._frame); 
        //   _this._map._render();

        // });
      } else {
        this.setAttribute('data-tooltip-content', 'Start recording video');
        _this._btn.className = 'maplibregl-ctrl-icon maplibregl-ctrl-recordvideo-start';

        if (_this._mapcontainer.state.mediarecorder) {
          _this._mapcontainer.state.mediarecorder.stop();
          _this._mapcontainer.setState({mediarecorder: null});
        }
          
        toast.success('Recording finished - saved to your downloads');

        // if (_this._encoder) {
        //   _this._map._render();
        //   _this._map.off('render', _this._frame);
        //   const mp4 = _this._encoder.end();
        //   const anchor = document.createElement("a");
        //   anchor.href =  URL.createObjectURL(new Blob([mp4], {type: "video/mp4"}));
        //   const now = new Date();
        //   const timesuffix = now.toISOString().substring(0,19).replaceAll('T', ' ').replaceAll(':', '-');
        //   anchor.download = "positivefarms - " + timesuffix;
        //   anchor.click();
        //   _this._encoder = null;
        //   _this._frame = null;
        // }
      } 
    };
    
    this._container = document.createElement('div');
    this._container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
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
    loading: true,
    maploaded: false,
    context: 0,
    satellite: false,
    flying: false,
    flyingcentre: null,
    recording: false,
    lat: null,
    lng: null,
    zoom: null,
    pitch: null,
    bearing: null,
    subdomain: null,
    scrollWheelZoom: true,	
    area: '',		
    bounds: null,
    showtooltip: true,
    mediarecorder: null,
    logo: null,
    icons_white: [],
    iconsloaded_white: false,
    icons_grey: [],
    iconsloaded_grey: false,
    animationinterval: 0,
    idle: false,
    windspeed: 0,
    alertIsOpen: false,
    alertText: '',
    terrain: {source: "terrainSource", exaggeration: 1.1 },
  }

  hoveredPolygonId = null;

  constructPlanningConstraints = (planningconstraints) => {
    // Get existing ids in planning constraints stylesheet
    var idsinstylesheet = [];
    for(let i = 0; i < planningconstraints.length; i++) idsinstylesheet.push(planningconstraints[i]['id']);

    // Set colours of planning constraints according to globals
    var colourlookup = {};
    var layerlookup = {};
    var planningconstraints_list = Object.keys(PLANNING_CONSTRAINTS);
    var id;
    for(let i = 0; i < planningconstraints_list.length; i++) {
      for(let j = 0; j < PLANNING_CONSTRAINTS[planningconstraints_list[i]]['layers'].length; j++) {
        id = PLANNING_CONSTRAINTS[planningconstraints_list[i]]['layers'][j];
        colourlookup[id] = PLANNING_CONSTRAINTS[planningconstraints_list[i]]['colour'];
        layerlookup[id] = PLANNING_CONSTRAINTS[planningconstraints_list[i]]['description'];
        if (!idsinstylesheet.includes(id)) {
          idsinstylesheet.push(id);
          var idelements = id.split("_");
          var layerid = idelements[1];
          idelements.splice(0, 2);
          var styletype = idelements.join("_");
          var styleelement = JSON.parse(JSON.stringify(this.style_planningconstraints_defaults[styletype]));
          styleelement['id'] = id;
          styleelement['source-layer'] = layerid;
          if ('line-color' in styleelement['paint']) styleelement['paint']['line-color'] = colourlookup[id];
          if ('fill-color' in styleelement['paint']) styleelement['paint']['fill-color'] = colourlookup[id];
          planningconstraints.push(styleelement);
        }
      }
    }

    this.layerlookup = layerlookup;
    this.interactivelayers = [ 
      'positivefarms_background', 
      'positivefarms_active', 
      'renewables_background',
      'renewables_active',
      'renewables_windturbine',
      'customgeojson_windturbine',
      'customgeojson_solarfarm',
      'windspeed'
    ].concat(idsinstylesheet);

    return planningconstraints;
  }

  incorporateBaseDomain = (baseurl, planningconstraints, json) => {

    let newjson = JSON.parse(JSON.stringify(json));
    const sources_list = ['openmaptiles', 'terrainSource', 'hillshadeSource', 'planningconstraints', 'windspeed', 'renewables', 'positivefarms'];

    for(let i = 0; i < sources_list.length; i++) {
      var id = sources_list[i];
      if (id in newjson['sources']) {
        if ('url' in newjson['sources'][id]) {
          if (!(newjson['sources'][id]['url'].startsWith('http'))) {
            newjson['sources'][id]['url'] = baseurl + newjson['sources'][id]['url'];
          }       
        }
      }
    }

    var newlayers = [];
    for(let i = 0; i < newjson['layers'].length; i++) {
      if (newjson['layers'][i]['id'] === 'planning-constraints') {
        for(let j = 0; j < planningconstraints.length; j++) newlayers.push(planningconstraints[j]);
      } else {
        newlayers.push(newjson['layers'][i]);
      }
    }
    newjson['layers'] = newlayers;
    newjson['glyphs'] = baseurl + newjson['glyphs'];
    newjson['sprite'] = baseurl + newjson['sprite'];

    // Delete farms from positiveplaces.org
    if (POSITIVE_SITE.shortcode === 'positiveplaces') {
      newlayers = [];
      for(let i = 0; i < newjson['layers'].length; i++) {
        if (newjson['layers'][i]['source'] !== 'positivefarms') newlayers.push(newjson['layers'][i]);
      }
      delete newjson['sources']['positivefarms'];
      newjson['layers'] = newlayers;
    }

    return newjson;
  }


  constructor(props) {
    super(props);
    this.mapRef = React.createRef();
    this.popupRef = React.createRef();
    this.maxTileCacheSize = this.getMaxTileCacheSize();
    this.ukgeojson = require('../constants/UK.json');
    this.style_planningconstraints_defaults = require('../constants/style_planningconstraints_defaults.json');
    this.style_twodimensions = require('../constants/style_twodimensions.json');
    this.style_threedimensions = require('../constants/style_threedimensions.json');
    this.style_planningconstraints = this.constructPlanningConstraints(require('../constants/style_planningconstraints.json'));
    this.satellitelayer = this.incorporateBaseDomain(TILESERVER_BASEURL, this.style_planningconstraints, this.style_threedimensions);
    this.nonsatellitelayer = this.incorporateBaseDomain(TILESERVER_BASEURL, this.style_planningconstraints, this.style_twodimensions);

    // Add other explicit conditionals as 'require' requires explicit filenames during build

    this.props.fetchAllProperties();

    this.state.lat = props.lat;
    this.state.lng = props.lng;
    this.state.zoom = props.zoom;  
    this.state.pitch = props.pitch;
    this.state.bearing = props.bearing;
    this.state.plan = props.plan;

    var fulldomains = Object.keys(POSITIVE_SITES);
    var ignoredomains = ['localhost', '192'];
    for(let i = 0; i < fulldomains.length; i++) ignoredomains.push(fulldomains[i].split('.')[0]);
    this.ignoredomains = ignoredomains;

    var devicePixelRatio = parseInt(window.devicePixelRatio || 1);
    var logo = new Image();
    if (POSITIVE_SITE.shortcode === "positivefarms") {
      if (devicePixelRatio === 1) {
        logo.src = "/static/assets/media/positivefarms-glow.png";
      } else if (devicePixelRatio === 2) {
        logo.src = "/static/assets/media/positivefarms-glowx2.png";
      } else if (devicePixelRatio === 3) {
        logo.src = "/static/assets/media/positivefarms-glowx3.png";
      } else if (devicePixelRatio === 4) {
        logo.src = "/static/assets/media/positivefarms-glowx4.png";
      }
    } else {
      if (devicePixelRatio === 1) {
        logo.src = "/static/assets/media/positiveplaces-glow.png";
      } else if (devicePixelRatio === 2) {
        logo.src = "/static/assets/media/positiveplaces-glowx2.png";
      } else if (devicePixelRatio === 3) {
        logo.src = "/static/assets/media/positiveplaces-glowx3.png";
      } else if (devicePixelRatio === 4) {
        logo.src = "/static/assets/media/positiveplaces-glowx4.png";
      }
    }

    this.state.logo = logo;

    let params = queryString.parse(this.props.location.search);
    if (params.plan !== undefined) this.state.plan = params.plan;
    if (params.lat !== undefined) this.state.lat = params.lat;
    if (params.lng !== undefined) this.state.lng = params.lng;
    if (params.zoom !== undefined) this.state.zoom = params.zoom;  
    if (params.pitch !== undefined) this.state.pitch = params.pitch;  
    if (params.bearing !== undefined) this.state.bearing = params.bearing;  
    if (params.satellite !== undefined) {
      if (params.satellite === "yes") this.state.satellite = true;
    }

    this.extrusiontoggle = new ExtrusionControl({mapcontainer: this});
    this.pitchtoggle = new PitchToggle({mapcontainer: this, pitch: 80, extrusiontoggle: this.extrusiontoggle});
    this.terraintoggle = new TerrainControl({mapcontainer: this, options: this.state.terrain});
    this.flytoggle = new FlyToggle({mapcontainer: this});
    this.recordvideo = new RecordVideo({mapcontainer: this});

    if (!this.props.global.mapinitialized) {
      let subdomain = getURLSubdomain();
      let externalreference = getExternalReference();
      if (externalreference) {
        this.props.fetchExternalReference(externalreference).then(() => {
          if (!(this.ignoredomains.includes(subdomain))) {
            this.state.subdomain = subdomain;
            this.props.fetchContext(this.state.subdomain, this.props.isMobile).then(() => {
              this.props.setGlobalState({"mapinitialized": true});
            }) 
          } else {
            this.props.setGlobalState({"mapinitialized": true});
          }      
        })
      } else if (!(this.ignoredomains.includes(subdomain))) {
        this.state.subdomain = subdomain;
        this.props.fetchContext(this.state.subdomain, this.props.isMobile).then(() => {
          this.props.setGlobalState({"mapinitialized": true});
        }) 
      } else {
        this.props.setGlobalState({"mapinitialized": true});
      }  
    }
  }

  flyingStart = () => {
    this.setState({flying: true}, () => {
      console.log("isIdle",this.state.idle);
      if (this.state.idle) this.flyingRun();
    });
  }

  flyingRun = () => {
    var halfinterval = 60000;
    var degreesperiteration = 120;

    if (this.mapRef) {
      var map = this.mapRef.current.getMap();
      var centre = map.getCenter();
      var zoom = map.getZoom();
      if (this.props.global.centre) centre = this.props.global.centre;
      else {
        console.log("Centre is not set - using map's center");
        this.props.setGlobalState({centre: centre});
      }
      if (this.props.global.zoom) zoom = this.props.global.zoom;
      else this.props.setGlobalState({zoom: zoom});        
      map.jumpTo({center: centre, zoom: zoom});
      var newbearing = parseInt(map.getBearing() + degreesperiteration);
      console.log("About to rotateTo", newbearing, centre);
      map.rotateTo(parseFloat(newbearing), {around: centre, easing(t) {return t;}, duration: halfinterval});  
      // map.rotateTo(map.getBearing() + degreespersecond * (interval / 1000), { 
      //   around: centre, easing(t) {return t;}, duration: interval 
      // });  
    }
  }

  flyingStop = () => {
    this.setState({flying: false}, () => {
      if (this.props.global.flyingtimer) {
        clearTimeout(this.props.global.flyingtimer);
      }
      this.props.setGlobalState({flyingtimer: null});

      if (this.mapRef) {
        var map = this.mapRef.current.getMap();
        var centre = map.getCenter();
        var zoom = map.getZoom();
        map.jumpTo({center: centre, zoom: zoom});
      }
    })
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

  
  onRender = (event) => {

    var gl = event.target.painter.context.gl;
    var canvas = event.target.getCanvas();

    // Have to do some involved gl drawing to set background colour on transparency
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.enable( gl.BLEND );
    gl.blendEquation( gl.FUNC_ADD );
    gl.blendFunc( gl.ONE_MINUS_DST_ALPHA, gl.DST_ALPHA );
    if (!initShaders(gl)) {
      console.log('Failed to intialize shaders.');
      return;
    }

    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the positions of the vertices');
      return;
    }

    gl.drawArrays(gl.TRIANGLES, 0, n);

    if (this.state.recording) {
      if (this.state.logo) {
        renderImage(gl, this.state.logo);
      }  
    }
  }

  animateIcons = () => {
    // const intervalmsecs = 250;
    const numframes = 5;
    const totalduration = numframes * ANIMATION_INTERVAL;
    setTimeout(this.animateIcons, ANIMATION_INTERVAL);

    if ((this.state.iconsloaded_white) && (this.state.iconsloaded_grey)) {
      const currentDate = new Date();
      const milliseconds = currentDate.getTime(); 
      const deltamsecs = milliseconds % totalduration;
      const animationindex = 1 + parseInt(deltamsecs / ANIMATION_INTERVAL);
      if ((this.mapRef !== null) && (this.mapRef.current !== null)) {
        var map = this.mapRef.current.getMap();
        if (map) {
          if (this.state.satellite) {
            if (this.state.icons_white[animationindex] !== undefined) {
              try {
                map.removeImage('windturbine_white');
              }
              catch(err) {
                console.log(err);
              }        
              map.addImage('windturbine_white', this.state.icons_white[animationindex]);    
            }
          } else {
            if (this.state.icons_grey[animationindex] !== undefined) {
              try {
                map.removeImage('windturbine_grey');
              }
              catch(err) {
                console.log(err);
              }        
              map.addImage('windturbine_grey', this.state.icons_grey[animationindex]);    
            }
          }
        }
      }
    }  
  }

  onLoad = (event) => {
    this.props.setGlobalState({"mapref": this.mapRef}).then(() => {
      setInterval(this.fetchLastExport, 15000);
    });
    var map = this.mapRef.current.getMap();

    mapRefreshPlanningConstraints(
      this.props.global.showplanningconstraints, 
      this.props.global.planningconstraints,
      map);

    mapRefreshWindspeed(this.props.global.showwindspeed, map);

    if (this.state.plan !== '') this.props.fetchCustomGeoJSON('', this.state.plan);
    else if (this.props.positivecookie !== '') this.props.fetchCustomGeoJSON(this.props.positivecookie, '');
    
    // map.loadImage('/static/assets/icon/actionIcons/coloured/windturbine_sdf_final.png', (error, image) => {
    //   if (error) throw error;
    //   // add image to the active style and make it SDF-enabled
    //   map.addImage('windturbine-sdf', image, { sdf: true });
    // });

    // Only animate turbines on non-iOS platforms due to limited memory on iOS
    var isiOS = this.isiOS();

    // isiOS = true;

    if (!isiOS) {
      console.log("Initializing images...");
      var url = null;
      for(let i = 1; i < 6; i++) {
        url = process.env.PUBLIC_URL + "/static/icons/windturbine_white_animated_" + i.toString() + ".png";
        map.loadImage(url, (error, image) => {
            if (error) throw error;
            var icons_white = this.state.icons_white;
            icons_white[i] = image;
            this.setState({icons_white: icons_white});
            if (i === 5) {
              console.log("Loaded turbine images (white)");
              this.setState({iconsloaded_white: true});
            }
        });            
      }

      for(let i = 1; i < 6; i++) {
        url = process.env.PUBLIC_URL + "/static/icons/windturbine_grey_animated_" + i.toString() + ".png";
        map.loadImage(url, (error, image) => {
            if (error) throw error;
            var icons_grey = this.state.icons_grey;
            icons_grey[i] = image;
            this.setState({icons_grey: icons_grey});
            if (i === 5) {
              console.log("Loaded turbine images (grey)");
              this.setState({loading: false, iconsloaded_grey: true});
            }
        });            
      }
    } else {
      this.setState({loading: false});
    }
        
    map.addControl(this.pitchtoggle, 'top-left'); 
    map.addControl(this.terraintoggle, 'top-left');
    map.addControl(this.extrusiontoggle, 'top-left');
    map.addControl(this.flytoggle, this.props.isMobile ? 'top-right' : 'top-left'); 
    map.addControl(this.recordvideo, this.props.isMobile ? 'top-right' : 'top-left'); 
    map.setPadding(this.props.isMobile ? MOBILE_PADDING : DESKTOP_PADDING);

    var popup = this.popupRef.current;
    popup.remove();  

    if (this.props.global.context) {
      // If context set, filter out entities not in context
      if (POSITIVE_SITE.shortcode === "positivefarms") {
        map.setFilter('positivefarms_background', 
          ["all", ["in", "'" + this.props.global.context.id.toString() + "'", ["get", "contexts"]]]);
      }
      map.setFilter('renewables_background', 
        ["all", ["in", "'" + this.props.global.context.id.toString() + "'", ["get", "contexts"]]]);
      map.setFilter('renewables_windturbine', 
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

    if (!isiOS) setTimeout(this.animateIcons, 1000);

    this.setState({maploaded: true});
  }

  onMouseEnter = (event) => {

    var map = this.mapRef.current.getMap();

    if (this.props.global.editcustomgeojson) return;

    if (event.features.length > 0) {
      if (this.hoveredPolygonId === null) {
        if (event.features[0].sourceLayer === 'windspeed') {
          var windspeed = parseFloat(event.features[0].properties['DN'] / 10);
          this.props.setGlobalState({'windspeed': windspeed});
          return;
        }

        if ((event.features[0].source === 'planningconstraints') || 
            (event.features[0].sourceLayer === 'landuse')) {
          // If mouse over planning constraints, disable add wind turbine
          if (this.props.global.editcustomgeojson === 'wind') {
            this.props.global.mapdraw.changeMode('simple_select');
          }
          return;
        }
          
        map.getCanvas().style.cursor = 'pointer';
        var properties = event.features[0].properties;
        // Note unique numberical ID required for setFeatureState
        // OSM ids, eg 'way/12345' don't work
        this.hoveredPolygonId = event.features[0].id;
        if (properties.type !== 'custom') {
          if (POSITIVE_SITE.shortcode === "positivefarms") {
            map.setFeatureState(
              { source: 'positivefarms', sourceLayer: 'positivefarms', id: this.hoveredPolygonId },
              { hover: true }
            );
          }
          map.setFeatureState(
            { source: 'renewables', sourceLayer: 'renewables', id: this.hoveredPolygonId },
            { hover: true }
          );
        }

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
        if (properties.subtype === 'wind') popup.setOffset([0, -20]);
        else popup.setOffset([0, 0]);
        popup.setLngLat(featurecentroid.geometry.coordinates).setHTML(description).addTo(map);
      }  
    }
  }

  onMouseMove = (event) => {

    if (event.features.length > 0) {
      if (event.features[0].sourceLayer === 'windspeed') {
        var windspeed = parseFloat(event.features[0].properties['DN'] / 10);
        this.props.setGlobalState({'windspeed': windspeed});
        return;
      }

      if ((event.features[0].source === 'planningconstraints') || 
          (event.features[0].sourceLayer === 'landuse')) {
        // If mouse over planning constraints, disable add wind turbine
        if (this.props.global.editcustomgeojson === 'wind') {
          this.props.global.mapdraw.changeMode('simple_select');
        }
        return;
      }
    } 
    
    if (this.props.global.editcustomgeojson) return;

    if (this.hoveredPolygonId) {
      var popup = this.popupRef.current;
      popup.setLngLat(event.lngLat);
    }
  }

  onMouseLeave = (event) => {

    var map = this.mapRef.current.getMap();
    var popup = this.popupRef.current;

    // If mouse leaving feature, enable add wind turbine
    if (this.props.global.editcustomgeojson === 'wind') {
      this.props.global.mapdraw.changeMode('draw_point');
    }

    if (this.hoveredPolygonId) {
      if (POSITIVE_SITE.shortcode === "positivefarms") {
        map.setFeatureState(
          { source: 'positivefarms', sourceLayer: 'positivefarms', id: this.hoveredPolygonId },
          { hover: false }
        );
      }
      map.setFeatureState(
        { source: 'renewables', sourceLayer: 'renewables', id: this.hoveredPolygonId },
        { hover: false }
      );
    }
    this.hoveredPolygonId = null;
    map.getCanvas().style.cursor = '';
    popup.remove();  
  }

  onClick = (event) => {
    // Don't select features if adding asset
    if (event.features.length > 0) {
      var id = event.features[0]['layer']['id'];
      if ((id === 'constraint_windspeed_fill_colour') ||
          (event.features[0].source === 'planningconstraints') || 
          (event.features[0].sourceLayer === 'landuse')) {
            this.setState(
              {
                alertIsOpen: true, 
                alertText: "<p>Non-optimal site for wind turbine due to: </p><p><b>" + this.layerlookup[id] + "</b></p>"
              });
          return;
      }

      if (event.features[0].sourceLayer === 'windspeed') {
        var windspeed = parseFloat(event.features[0].properties['DN'] / 10);
        this.props.setGlobalState({'windspeed': windspeed});
        return;
      }
    }

    if (this.props.global.editcustomgeojson === null) {
      if (event.features.length > 0) {
        if (event.features[0].properties.type === 'custom') {

          var customentity = {
            name: 'Manually-added renewables',
            customgeojson: this.props.global.customgeojson
          }

          this.props.setGlobalState({'drawer': true, 'searching': false, entities: {entities: [customentity]}});
          this.props.resetGeosearch();
          this.props.setSearchText(customentity.name);
      
          if (this.props.global.customgeojson.features.length > 0) {

            var overallboundingbox = getBoundingBox(this.props.global.customgeojson);
            var map = this.mapRef.current.getMap();
            this.props.setGlobalState({fittingbounds: true});
            map.fitBounds(overallboundingbox, {animate: true});
          }

        } else {
          console.log(event.features[0]);
          var entityid = event.features[0].properties.id;
          this.selectEntity(entityid);
        }
      }  
    }
  }

  onResize = (event) => {
    if (this.state.maploaded) {
      var map = this.mapRef.current.getMap();
      map.setPadding(this.props.isMobile ? MOBILE_PADDING : DESKTOP_PADDING);
      map.removeControl(this.pitchtoggle);
      map.addControl(this.pitchtoggle, this.props.isMobile ? 'top-left' : 'top-left'); 
      map.removeControl(this.terraintoggle);
      map.addControl(this.terraintoggle, this.props.isMobile ? 'top-left' : 'top-left'); 
      map.removeControl(this.extrusiontoggle);
      map.addControl(this.extrusiontoggle, this.props.isMobile ? 'top-left' : 'top-left'); 
      map.removeControl(this.flytoggle);
      map.addControl(this.flytoggle, this.props.isMobile ? 'top-right' : 'top-left'); 
      map.removeControl(this.recordvideo);
      map.addControl(this.recordvideo, this.props.isMobile ? 'top-right' : 'top-left'); 
    }
  }

  onIdle = (event) => {
    if (this.props.global.editcustomgeojson === null) {
      if (this.mapRef) {
        let map = this.mapRef.current.getMap();
        let map_customgeojson = map.querySourceFeatures("customgeojson");
        if ((map_customgeojson.length === 0) && (this.props.global.customgeojson.features.length !== 0)) {
          this.reloadCustomGeoJSON();
        }
      }  
    }


    this.setState({idle: true}, () => {
      if (this.state.flying) {
        console.log("onIdle, triggering flyaround");
        // setTimeout(this.flyingRun, 1000);
        this.flyingRun();
      }
    })
  }

  onZoomEnd = (event) => {
    var map = this.mapRef.current.getMap();
    if (map) {
      // Allow user to change flying zoom when not flying
      if (!this.state.flying) {
        this.props.setGlobalState({zoom: map.getZoom()});
      }
    }
  }

  onRotateEnd = (event) => {
    // if (this.state.flying) {
    //   this.flyingRun();
    // }
  }

  onMoveEnd = (event) => {

      // Update search results and URL after moving map

      var map = this.mapRef.current.getMap();
      let zoom = map.getZoom();
      let center = map.getCenter();
      let pitch = map.getPitch();
      let bearing = map.getBearing();
      let satellite = this.state.satellite ? "yes" : "no";
      let plan = this.state.plan;

      // Refresh search results if geosearch on and flying off
      if ((this.props.search.geosearch) && (!this.state.flying)) {
        if ((this.props.search.geosearch !== null) && (this.props.isMobile !== null)) {
          this.props.fetchEntitiesByProperty(this.props.search.geosearch, this.props.isMobile);
        }          
      }

      if (map) {
        if (this.props.global.fittingbounds) {
          this.props.setGlobalState({zoom: map.getZoom(), fittingbounds: false}).then(() => {
            if (this.state.flying) this.flyingRun();
          });
        } 
        if (!(this.state.flying)) {
          this.props.setGlobalState({centre: map.getCenter(), zoom: map.getZoom()});
        } 
      }
  
      if (this.props.search.searchtext === '') {
        this.props.fetchSearchResults('');
      }

      if (plan === '') {
        setURLState({ 'lat': center.lat, 
          'lng': center.lng, 
          'zoom': zoom,
          'pitch': pitch,
          'bearing': bearing,
          'satellite': satellite
        }, this.props.history, this.props.location);
      } else {
        setURLState({ 'lat': center.lat, 
          'lng': center.lng, 
          'zoom': zoom,
          'pitch': pitch,
          'bearing': bearing,
          'satellite': satellite,
          'plan': plan
        }, this.props.history, this.props.location);
      }
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

  isiOS = () => {
    // From https://stackoverflow.com/questions/9038625/detect-if-device-is-ios
    // and https://davidwalsh.name/detect-iphone

    return (  (navigator.userAgent.match(/iPhone/i)) || 
              (navigator.userAgent.match(/iPod/i)) || 
              (navigator.userAgent.match(/iPad/i)) ||
              (navigator.userAgent.includes("Mac") && "ontouchend" in document));              
  }

  isAndroid = () => {
    // From https://davidwalsh.name/detect-android
    var ua = navigator.userAgent.toLowerCase();
    var isAndroid = ua.indexOf("android") > -1; 
    return isAndroid;
  }

  getMaxTileCacheSize = () => {
    var maxtilecachesize = 60;
    if (this.isiOS()) {
      maxtilecachesize = 1;
      console.log("iOS, using maxtilecachesize", maxtilecachesize);
      return maxtilecachesize;
    }
    if (this.isAndroid()) {
      maxtilecachesize = 20;
      console.log("Android, using maxtilecachesize", maxtilecachesize);
      return maxtilecachesize;
    }

    console.log("Not iOS or Android, using maxtilecachesize", maxtilecachesize);

    return maxtilecachesize;
  }

  onMouseEnterAssetFinish = () => {
    if (this.props.global.editcustomgeojson === 'solar') {
      this.props.global.mapdraw.changeMode('simple_select');
    }
  }

  onMouseExitAssetFinish = () => {
    if (this.props.global.editcustomgeojson === 'solar') {
      this.props.global.mapdraw.changeMode('draw_polygon');
    }
  }

  reloadCustomGeoJSON = () => {
    if (this.mapRef) {
      var map = this.mapRef.current.getMap();
      if (map) {
        map.getSource("customgeojson").setData(this.props.global.customgeojson);
      }    
    }
  }

  editcustomgeojsonFinish = (ev) => {
    ev.stopPropagation();

    if (this.mapRef) {
      var map = this.mapRef.current.getMap();
      var customgeojson = JSON.parse(JSON.stringify(this.props.global.mapdraw.getAll()));
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
          outputfeatures.push(customgeojson.features[i]);
        }
      }
      for(let i = 0; i < postfeatures.length; i++) outputfeatures.push(postfeatures[i]);
      customgeojson = {type: 'FeatureCollection', features: outputfeatures};
      var oldcustomgeojson = JSON.stringify(this.props.global.customgeojson);
      // Compare old with new to determine whether to save and invalidate plan shortcode
      if (oldcustomgeojson !== JSON.stringify(customgeojson)) {
        this.props.updateCustomGeoJSON(this.props.positivecookie, '', customgeojson);
        this.props.setGlobalState({customgeojson: customgeojson});
        // We remove 'plan' parameter after edit as customgeojson may diverge from saved plan
        modifyURLParameter({plan: null}, this.props.history, this.props.location);
        this.setState({plan: ''});

        if (this.props.global.drawer) {
          var customentity = {
            name: 'Manually-added renewables',
            customgeojson: customgeojson
          }
          this.props.setGlobalState({entities: {entities: [customentity]}});
        }
      }

      if (map) {
        map.removeControl(this.props.global.mapdraw);
        map.getSource("customgeojson").setData(customgeojson);
      }    
    }
    this.props.setGlobalState({editcustomgeojson: null});
  }

  closePlanningConstraints = () => {
    var map = this.mapRef.current.getMap();
    if (this.props.global.showplanningconstraints) map.removeControl(this.props.global.grid);
    else map.addControl(this.props.global.grid);    
    this.props.setGlobalState({showplanningconstraints: false}).then(() => {
      mapRefreshPlanningConstraints(
        this.props.global.showplanningconstraints, 
        this.props.global.planningconstraints,
        map);
    });
  }

  togglePlanningConstraint = (planningconstraint) => {
    var planningconstraints = this.props.global.planningconstraints;
    planningconstraints[planningconstraint] = !(planningconstraints[planningconstraint]);
    this.props.setGlobalState({planningconstraints: planningconstraints}).then(() => {
      mapRefreshPlanningConstraints(
        this.props.global.showplanningconstraints, 
        this.props.global.planningconstraints,
        this.mapRef.current.getMap());
    });
  }

  transformRequest = (url, resourceType) => {
    // if (url.indexOf('s3.amazonaws.com/elevation-tiles-prod') !== -1) {
    //   var urlelements = url.split('/');
    //   var zoom = parseInt(urlelements[5]);
    //   var xtile_tl = parseInt(urlelements[6]);
    //   var ytile_tl = parseInt(urlelements[7]);
    //   var xtile_br = (xtile_tl + 1);
    //   var ytile_br = (ytile_tl + 1);
    //   var n = Math.pow(2, zoom);
    //   var lon_deg_tl = parseFloat(360.0 * xtile_tl / n)  - 180.0;
    //   var lon_deg_br = parseFloat(360.0 * xtile_br / n)  - 180.0;
    //   var lat_rad_tl = Math.atan(Math.sinh(Math.PI * (1 - (2 * ytile_tl / n))));
    //   var lat_rad_br = Math.atan(Math.sinh(Math.PI * (1 - (2 * ytile_br / n))));
    //   var lat_deg_tl = (lat_rad_tl * 180.0 / Math.PI);
    //   var lat_deg_br = (lat_rad_br * 180.0 / Math.PI);
    //   var tilegeojson = bboxPolygon([lon_deg_tl, lat_deg_tl, lon_deg_br, lat_deg_br]);
    //   if ((!booleanOverlap(this.ukgeojson.geometry, tilegeojson.geometry)) && 
    //       true ) {
    //     console.log("Tile not in UK", lat_deg_tl, lon_deg_tl, lat_deg_br, lon_deg_br);
    //   } else {
    //     // console.log("Tile in UK", lat_deg_tl, lon_deg_tl, lat_deg_br, lon_deg_br);
    //   }
    //   return {url: 'http://localhost:8080/data/terrain/' + urlelements[5] + '/' + urlelements[6] + "/" + urlelements[7]};
    // }
  }

  render () {
    return (
      <>
        {/* <IonLoading translucent={true} isOpen={this.state.loading} message="Loading images and data..." spinner="circles" /> */}

        {this.props.global.mapinitialized ? (
          <Map ref={this.mapRef}
          onLoad={this.onLoad}
          onRender={this.onRender}
          onMouseEnter={this.onMouseEnter}
          onMouseMove={this.onMouseMove}
          onMouseLeave={this.onMouseLeave}
          onMoveEnd={this.onMoveEnd}
          onRotateEnd={this.onRotateEnd}
          onIdle={this.onIdle}
          onResize={this.onResize}
          onClick={this.onClick}
          onZoomEnd={this.onZoomEnd}
          minZoom={4}
          maxZoom={19}
          maxBounds={this.getMaxBounds()}
          maxPitch={85}
          preserveDrawingBuffer={true} 
          maxTileCacheSize={this.maxTileCacheSize}
          terrain={this.state.terrain}
          interactiveLayerIds={this.interactivelayers}
          initialViewState={{
            longitude: this.state.lng,
            latitude: this.state.lat,
            zoom: this.state.zoom,
            pitch: this.state.pitch,
            bearing: this.state.bearing
          }} 
          transformRequest={this.transformRequest}
          mapStyle={this.state.satellite ? this.satellitelayer : this.nonsatellitelayer}
        >

          <Toaster position="top-center"  containerStyle={{top: 20}}/>

          {this.props.global.editcustomgeojson ? (
            <div onMouseEnter={this.onMouseEnterAssetFinish} onMouseLeave={this.onMouseExitAssetFinish} style={{position: "absolute", top: this.props.isMobile ? "64px": "10px", left: "0px", width: "100vw"}}>
              <div style={{marginLeft: "50px", marginRight: this.props.isMobile ? "50px" : "calc(24% + 10px)", backgroundColor: "#ffffffaa"}}>
                <div>
                  <IonGrid style={{padding: "0px"}}>
                    <IonRow class="ion-align-items-center ion-justify-content-center">
                      <IonCol className="add-instructions">
                        <IonText>
                          {(this.props.global.editcustomgeojson === 'wind') ? (
                            <>Click on map to add one or more wind turbines then select "Finish" when complete</>
                          ) : null}
                          {(this.props.global.editcustomgeojson === 'solar') ? (
                            <>Click on map to draw outline of one or more solar farms then select "Finish" when complete</>
                          ) : null}
                          {(this.props.global.editcustomgeojson === 'edit') ? (
                            <>Click on existing wind/solar to select - then edit points, drag to move or select trash to delete</>
                          ) : null}
                        </IonText>
                      </IonCol>
                      <IonCol size="auto">
                        <IonButton size="small" onClick={this.editcustomgeojsonFinish}>Finish</IonButton>                                        
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>
              </div>
            </div>
          ) : null}

          {this.state.showtooltip ? (
            <Tooltip id="ctrlpanel-tooltip" place="right" variant="light" style={{fontSize: "120%"}} />
          ) : null}

          {this.props.isMobile ? (
              <>
              <GeolocateControl position="top-left" />
              </>
          ) : (
              <GeolocateControl position="top-left" />
          )}

          {this.props.isMobile ? (
              <>
              <NavigationControl showZoom={false} visualizePitch={true} position="top-left" />     
              </>
          ) : (
              <NavigationControl visualizePitch={true} position="top-left" />     
          )}

          <Popup longitude={0} latitude={0} ref={this.popupRef} closeButton={false} closeOnClick={false} />

        </Map>
      ) : null};

      {this.props.global.showplanningconstraints ? (
        <div style={{position: "absolute", bottom: "0px", left: "0px", width: "100vw", zIndex: "9999"}}>
          <div style={{marginLeft: "0px", marginRight: this.props.isMobile ? "0px" : "calc(24% + 10px)", backgroundColor: "#ffffffff"}}>
            <IonIcon style={{fontSize: "80%", position: "absolute", top: "10px", left: "10px"}} onClick={() => this.closePlanningConstraints()} icon={closeOutline} className="close-icon"/>
            <div>
              <IonGrid>
                <IonRow class="ion-align-items-center ion-justify-content-center">
                  <IonCol size="auto" className="planning-key-title-container">
                    <IonText className="planning-key-title">Non-optimal wind sites due to low wind / planning constraints</IonText>
                  </IonCol>
                </IonRow>
                <IonRow class="ion-align-items-center ion-justify-content-center">
                  <IonCol size="auto">
                    <div style={{paddingRight: "20px"}}>
                      {Object.keys(PLANNING_CONSTRAINTS).map((planningconstraint, index) => {
                        return (
                          <span 
                            key={index} 
                            onClick={() => this.togglePlanningConstraint(planningconstraint)} 
                            className="planning-key-item"
                            style={{
                              opacity: (this.props.global.planningconstraints[planningconstraint] ? 1 : 0.4),
                            }}>
                            <div style={{width: "25px", height: "10px", marginRight: "5px", display: "inline-block", backgroundColor: PLANNING_CONSTRAINTS[planningconstraint]['colour']}} />
                            {PLANNING_CONSTRAINTS[planningconstraint]['description']}
                          </span>  
                        )
                      })}
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </div>
            <div className="planning-key-footnote">Showing 1km grid squares. Source data copyright of multiple organisations - <a href="/datasets" target="_new" style={{color: "black"}}>see full list of source datasets</a></div>
          </div>
        </div>
      ) : null}

      <IonAlert
        id="alert-modal"
        isOpen={this.state.alertIsOpen}
        header="Problem with location"
        message={this.state.alertText}
        buttons={['OK']}
        onDidDismiss={() => this.setState({alertIsOpen: false})} >
      </IonAlert>

      </>
    )
  }
}

MapContainer.defaultProps = {
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  zoom: DEFAULT_ZOOM,
  pitch: DEFAULT_PITCH,
  bearing: DEFAULT_BEARING,
  plan: ''
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
      fetchCustomGeoJSON: (cookie, shortcode) => {
        return dispatch(global.fetchCustomGeoJSON(cookie, shortcode));
      },      
      updateCustomGeoJSON: (cookie, shortcode, customgeojson) => {
        return dispatch(global.updateCustomGeoJSON(cookie, shortcode, customgeojson));
      },      
      startFlyingTour: (entities) => {
        return dispatch(global.startFlyingTour(entities));
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
