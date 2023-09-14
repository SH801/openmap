import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { withSizes } from 'react-sizes'
import { IonText, IonIcon, IonList, IonLabel, IonButton, IonItem, IonInput, IonTextarea, IonCheckbox } from '@ionic/react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { closeOutline, trashOutline } from 'ionicons/icons';
import { mapSizesToProps } from '../../../../../service/checkScreenSize';
import { global, map, search } from '../../../../../actions';
import { 
    getIDs,
    getActions, 
    getBusinessTypes, 
    getEntityActions, 
    getEntityBusinessTypes 
} from  '../../../../../functions/properties';


export class EntityEditor extends Component {

    state = {
        name: '',
        address: '',
        img: '',
        desc: '',
        website: '',
        businesstypes: [],
        actions: [],
    }

    constructor(props) {
        super(props);

        this.state.name = props.entity['name'];
        this.state.address = props.entity['address'];
        this.state.img = props.entity['img'];
        this.state.desc = props.entity['desc'];
        this.state.website = props.entity['website'];
        this.state.data = JSON.stringify(props.entity['data'], null, 2);
        this.state.businesstypes = getIDs(getEntityBusinessTypes(props.entity));
        this.state.actions = getIDs(getEntityActions(props.entity));
        this.state.posts = props.entity['posts'];

        this.props.setSelected([...props.entity['geometrycodes']]).then(() => {
            this.props.redrawGeoJSON();
        });  
    }

    onChange = (event, variable) => {
        let newstate = {}
        newstate[variable] = event.detail.value;
        this.setState(newstate);
    }

    selectGeometryCode = (geometrycode) => {
        this.props.zoomToArea(geometrycode, this.props.isMobile);
    }

    deleteGeometryCode = (geometrycode) => {
        this.props.deleteSelected(geometrycode).then(() => {
            this.props.redrawGeoJSON();
        });
    }

    onPostTitleChange = (id, value) => {
        let posts = [...this.state.posts];
        posts[id]['title'] = value;
        posts[id]['date'] = null;
        this.setState({'posts': posts});
    }

    onPostTextChange = (id, value) => {
        let posts = [...this.state.posts];
        posts[id]['text'] = value;
        posts[id]['date'] = null;
        this.setState({'posts': posts});
    }

    addPost = () => {
        let newpost = {'id': null, 'title': 'Default post title', 'text': '', 'date': null};
        let posts = [...this.state.posts];
        posts.push(newpost);
        this.setState({'posts': posts});
    }

    // onPostBodyChange = ()
    cancelEdit = () => {
        this.props.exitMapEdit();
        this.props.setGlobalState({'editentity': null, 'drawer': false});  
        this.props.resetSelected().then(() => {this.props.redrawGeoJSON();});  
    }

    saveEdit = () => {
        let entity = {...this.state};
        entity['id'] = this.props.global.editentity;
        entity.geometrycodes = [...this.props.map.selected];
        this.props.updateEntity(entity).then(() => {
            this.props.setGlobalState({'editentity': null, 'drawer': false});  
            this.props.resetSelected().then(() => {
                this.props.exitMapEdit().then(() => {
                    this.props.refreshMapData().then(() => {
                        this.props.redrawGeoJSON();
                    });
                });
            });
        });
    }
    
    setChecked = (e, statevar) => {
        // Add/remove items from relevant state variable
        const id = parseInt(e.target.id);
        let list = this.state[statevar];
        if (e.detail.checked) list.push(id);
        else list.splice(list.indexOf(id), 1);     
        this.setState({statevar: list});
    }

    deletePost = (index) => {
        console.log("Delete post", index);
        let posts = [...this.state.posts];
        posts.splice(index, 1);
        this.setState({'posts': posts});
    }

    getEditableList = (list, selectedids, statevar) => {

        return (
            <>
            {list.map((property, index) => {
                return(
                    <div key={index}>
                        <IonCheckbox onIonChange={e => this.setChecked(e, statevar)} id={property['id']} checked={selectedids.includes(property['id'])} labelPlacement="start"></IonCheckbox>
                        <IonLabel>&nbsp;{property.name}</IonLabel>
                    </div>
                );
            })}
            </>
        )
    }

    render() {

        let actions = getActions(this.props.global.allproperties);
        let businesstypes = getBusinessTypes(this.props.global.allproperties);

        return (
        <>
            <h1>Edit / add farm</h1>
            <IonList lines="none">

                <h2>Selected areas</h2>
                <div className="entity-geometrycodes">
                    {this.props.map.selected.map((geometrycode, index) => {
                        return (
                            <IonText style={{textWrap: "nowrap"}} key={index} className="ion-text-capitalize entity-geometrycode">
                                <span onClick={() => this.selectGeometryCode(geometrycode)}>
                                    {geometrycode.replace('INSPIRE:', '')}
                                </span>
                                <span>
                                <IonIcon onClick={() => this.deleteGeometryCode(geometrycode)} className="entity-geometrycode-delete" icon={closeOutline}/>
                                </span>

                            </IonText>
                        )
                    })}
                </div>

                <IonItem className="ion-no-padding">
                    <IonLabel position="floating">Name</IonLabel>
                    <IonInput type="text" placeholder="Enter name" value={this.state.name} onIonChange={(e) => this.onChange(e, 'name')} />
                </IonItem>
                <IonItem className="ion-no-padding">
                    <IonLabel position="floating">Address</IonLabel>
                    <IonInput type="text" placeholder="Enter address" value={this.state.address} onIonChange={(e) => this.onChange(e, 'address')} />
                </IonItem>
                <IonItem className="ion-no-padding">
                    <IonLabel position="floating">Image URL</IonLabel>
                    <IonInput type="text" placeholder="Enter image URL" value={this.state.img} onIonChange={(e) => this.onChange(e, 'img')} />
                </IonItem>
                <IonItem className="ion-no-padding">
                    <IonLabel position="floating">Website</IonLabel>
                    <IonInput type="text" placeholder="Enter website" value={this.state.website} onIonChange={(e) => this.onChange(e, 'website')} />
                </IonItem>
                <IonItem className="ion-no-padding">
                    <IonLabel>Description</IonLabel>
                </IonItem>
                <CKEditor
                        editor={ ClassicEditor }
                        data={this.state.desc}
                        onChange={ ( event, editor ) => {this.setState({'desc': editor.getData()});} }
                />

                <h2>Properties</h2>
                {this.getEditableList(businesstypes, this.state.businesstypes, 'businesstypes')}
                {this.getEditableList(actions, this.state.actions, 'actions')}

                <h2>Posts</h2>
                {this.state.posts.map((post, index) => {
                    return(
                        <div key={index}>
                            <IonItem className="ion-no-padding">
                                <IonLabel position="floating">Title</IonLabel>
                                <IonInput type="text" placeholder="Enter post title" value={post.title} onIonChange={(e) => this.onPostTitleChange(index, e.detail.value)} />
                            </IonItem>
                            <CKEditor
                                editor={ ClassicEditor }
                                data={post.text}
                                onChange={ ( event, editor ) => {this.onPostTextChange(index, editor.getData())} }
                            />      
                            <IonItem className="ion-no-padding">
                                <IonIcon style={{position: "absolute", left: "0px"}} onClick={() => { 
                                    if (window.confirm('Are you sure you wish to delete this post?')) this.deletePost(index) 
                                }} icon={trashOutline} className="entity-edit"/>
                            </IonItem> 
                        </div>
                    );
                })}

                <IonButton color="success" onClick={() => this.addPost()}>Add post</IonButton>

                <h2>Data</h2>
                <IonItem className="ion-no-padding">
                    <IonTextarea placeholder="Enter JSON-formatted data" className="data-field" autoGrow="true" value={this.state.data} onIonChange={(e) => this.onChange(e, 'data')} />
                </IonItem>

                <IonItem className="ion-no-padding">
                </IonItem>

                <IonButton color="light" onClick={() => this.cancelEdit()}>Cancel</IonButton>
                <IonButton color="success" onClick={() => this.saveEdit()}>Save</IonButton>
            </IonList>
        </>
        );
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
    fetchEntity: (id, isMobile) => {
      return dispatch(global.fetchEntity(id, isMobile));
    },   
    updateEntity: (entity) => {
        return dispatch(global.updateEntity(entity));
    },     
    setGeosearch: (geosearch) => {
      return dispatch(search.setGeosearch(geosearch));
    },      
    resetGeosearch: () => {
      return dispatch(search.resetGeosearch());
    },      
    fetchEntitiesByProperty: (propertyid, isMobile) => {
      return dispatch(global.fetchEntitiesByProperty(propertyid, isMobile));
    },      
    resetEntities: () => {
      return dispatch(global.resetEntities());
    }, 
    setSelected: (selected) => {
        return dispatch(map.setSelected(selected));
    },     
    resetSelected: () => {
        return dispatch(map.resetSelected());
    },     
    deleteSelected: (selected) => {
        return dispatch(map.deleteSelected(selected));
    },  
    exitMapEdit: () => {
        return dispatch(map.exitMapEdit());
    },         
    refreshMapData: () => {
        return dispatch(map.refreshMapData());
    },  
    redrawGeoJSON: () => {
      return dispatch(map.redrawGeoJSON());
    },
    zoomToArea: (code, isMobile) => {
        return dispatch(map.zoomToArea(code, isMobile));
    },      
}
}  

export default withSizes(mapSizesToProps)(connect(mapStateToProps, mapDispatchToProps)(EntityEditor));