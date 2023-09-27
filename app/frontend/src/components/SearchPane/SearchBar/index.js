import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { global, search } from "../../../actions";
import { IonIcon, IonItem, IonText, IonToast } from '@ionic/react';
import { arrowBack, listOutline, searchOutline, close, locationOutline, mapOutline, storefrontOutline } from 'ionicons/icons';
import { mapReset, mapSelectEntity, mapSelectProperty } from '../../../functions/map';
import './searchBar.css';

export class SearchBar extends Component {

  state = {
    searchIcon: searchOutline,
    showToast: false,
  }

  searchStyles = {
    opacity: 1,
    transform: 'translateX(0)',
    height: '100vh',
    paddingBottom: '150px',
    overflowY: 'scroll',
    background: '#fff',
  };
  hiddenStyles = {
      opacity: 0,
      transform: 'translateX(-100%)',
  };
  
  onChange = (event) => {
    this.props.setGlobalState({'searching': true});
    if (event.target.value) {
      this.props.setSearchText(event.target.value);
      this.props.fetchSearchResults(event.target.value);
    } else {
      this.props.resetSearch();
      this.props.fetchSearchResults('');
    }
  };

  handleInputFocus = () => {
    this.props.setGlobalState({'searching': true});
    if (this.props.search.searchtext === '') {
      this.props.fetchSearchResults('');
    }
  }

  handleInputSubmit = () => {
    if (this.props.search.searchresults.length === 1) {
      const selectedItem = this.props.search.searchresults[0];
      this.selectItem(selectedItem);        
    }
  }

  handleIconClick = () => {
    this.props.setGlobalState({'searching': false})
  }

  handleClose = () => {
    if (this.props.global.mapref) {
      mapReset(this.props.global.context, this.props.global.mapref.current.getMap());
    }
    this.props.resetSearch();
    this.props.setGlobalState({'searching': false, 'drawer': false});
    this.props.resetEntities();
    
  }

  handleClick = (id) => {
    const selectedItem = this.props.search.searchresults[id];
    this.selectItem(selectedItem);
  }

  selectIcon = (type) => {
    const iconConvert = {
      'postcode': locationOutline,
      'location': mapOutline,
      'context': mapOutline,
      'entity': storefrontOutline,
      'selection': listOutline,
    }

    return iconConvert[type];
  }

  selectItem = (item) => {
    this.props.setGlobalState({'searching': false});
    this.props.setSearchText(item['name']);
    this.props.fetchSearchResults(item['name']);
    var map;
    if (this.props.global.mapref) {
      map = this.props.global.mapref.current.getMap();
    }

    switch(item['type']) {
      case 'postcode':
      case 'location':
        this.props.resetGeosearch();
        this.props.setGlobalState({'drawer': false});
        if (map) map.flyTo({center: [item.lng, item.lat], zoom: item.zoom}, {animate: false});
        break;  
      case 'context':
        this.props.resetGeosearch();
        this.props.setGlobalState({'drawer': false});
        const southWest = [item.bounds[0], item.bounds[1]];
        const northEast = [item.bounds[2], item.bounds[3]];
        if (map) {
          var centre = [(item.bounds[0] + item.bounds[2]) / 2, 
                        (item.bounds[1] + item.bounds[3]) / 2];
          map.fitBounds([southWest, northEast], {animate: false}); 
          this.setState({centre: centre});
        } 
        break;  
      case 'selection':
        this.props.setGeosearch(item['id']);
        this.props.setGlobalState({'drawer': true});
        this.props.fetchEntitiesByProperty(item['id'], this.props.isMobile);
        if (map) mapSelectProperty(this.props.global.context, map, item['id']);        
        break;
      default:
        this.props.resetGeosearch();
        this.props.setGlobalState({'drawer': true});
        this.props.fetchEntity(item['id'], this.props.isMobile);
        if (map) mapSelectEntity(this.props.global.context, map, item['id'])        
        break;  
      }
  }

  render() {

    return (
    <div className="search-overlay-container" style={{ backgroundColor: '#fff', zIndex: 1000 }}>

        <div className="search-bar-container">
            <IonIcon
              icon={this.props.global.searching ? arrowBack : searchOutline}
              onClick={() => this.handleIconClick()}
              style={{ fontSize: 24, cursor: "pointer" }}
            />
            <input 
              id="searchinput"
              placeholder="Name or location"
              spellCheck="false"
              autoComplete="false"
              value={this.props.search.searchtext}
              onChange={this.onChange}
              className="search-bar"
              style={{ outline: "none", border: "none" }}
              onFocus={() => this.handleInputFocus()}
              onKeyDown={(ev) => {
                this.props.setGlobalState({'searching': true});
                if (ev.key === 'Enter') {
                  this.handleInputSubmit()
                  ev.preventDefault();
                }
              }}
            />
            <IonToast
              isOpen={this.state.showToast}
              message=" Navigating to your position... "
              position="middle"
              duration={2000} />            
            <IonIcon
              icon={close}
              onClick={() => this.handleClose()}
              style={{
                fontSize: 24,
                opacity: this.props.search.searchtext !== "" ? 1 : 0,
                cursor: "pointer",
              }}
            />
        </div>

        <div
          className="suggestion-container"
          style={((this.props.global.searching === true) && (this.props.search.searchresults.length > 0))? this.searchStyles: this.hiddenStyles}
        >          
          {(this.props.global.searching === true) &&
            this.props.search.searchresults &&
            this.props.search.searchresults.map((result, index) => {
              return (
                <div key={index} onClick={() => this.handleClick(index)}>
                  <IonItem className="search-suggestion-el">
                    <IonIcon className="search-suggestion-icon" icon={this.selectIcon(result.type)}/>
                    <IonText style={{width:"100%"}}>
                      {result.name} 
                      {result.distance ? (
                        <div className="search-suggestion-el-distance">{result.distance} {result.distance === 1 ? ("mile"):("miles")}</div>
                      ) : null}
                    </IonText>
                  </IonItem>
                </div>
              );
            })}
        </div>

      </div>
    )
  }
}


export const mapStateToProps = state => {
  return {
    global: state.global,
    map: state.map,
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
    fetchSearchResults: (searchtext) => {
      return dispatch(search.fetchSearchResults(searchtext));
    },      
    resetSearch: () => {
      return dispatch(search.resetSearch());
    },      
    resetSearchResults: () => {
      return dispatch(search.resetSearchResults());
    },      
    setGeosearch: (geosearch) => {
      return dispatch(search.setGeosearch(geosearch));
    },      
    resetGeosearch: () => {
      return dispatch(search.resetGeosearch());
    },      
    fetchEntity: (id, isMobile) => {
      return dispatch(global.fetchEntity(id, isMobile));
    },      
    fetchEntitiesByProperty: (propertyid, isMobile) => {
      return dispatch(global.fetchEntitiesByProperty(propertyid, isMobile));
    },      
    resetEntities: () => {
      return dispatch(global.resetEntities());
    }, 
}
}  

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);