import React, {Component} from "react";
import {connect} from "react-redux";
import { Link } from 'react-router-dom';
import { 
  IonApp,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonContent, 
  IonHeader, 
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
} from "@ionic/react";
import { global, auth } from "../../actions";
import Toolbar from './../../components/toolbar';


class Login extends Component {

  state = {
    username: "",
    password: "",
  }

  onInputChange = (e) => {
    this.setState({[e.target.name]: e.detail.value});      
  };

  onSubmit = e => {
    e.preventDefault();
    this.props.login(this.state.username, this.state.password).then((e) => {
      this.props.history.push("/" + this.props.location.search);
    });
  }

  render() {
    return (
      <IonApp>
        <IonHeader>
          <Toolbar />
        </IonHeader>

        <IonContent className="ion-padding">
          <IonGrid>
            <IonRow style={{height: "60vh"}} class="ion-justify-content-center">
              <IonCol class="ion-align-self-center" style={{maxWidth: "300px"}}>
                <div>
                  <form onSubmit={this.onSubmit}>
                    <IonList lines="none" className="ion-text-center">
                      <h3>Login</h3>
                      <IonItem style={{height: "30px"}}></IonItem>
                      {this.props.errors.length !== 0 ? (
                        <div>Login failed, please try again...
                          <IonItem style={{height: "20px"}}></IonItem>
                        </div>
                      ) : null}
                      <IonItem className="ion-no-padding">
                        <IonLabel position="stacked">Username</IonLabel>
                        <IonInput name="username" type="text" placeholder="Username..." onIonChange={this.onInputChange}/>
                      </IonItem>
                      <IonItem className="ion-no-padding">
                        <IonLabel position="stacked">Password</IonLabel>
                        <IonInput name="password" type="password" placeholder="Password..." onIonChange={this.onInputChange}/>
                      </IonItem>
                      <IonItem style={{height: "30px"}}></IonItem>
                      <Link to={"/" + this.props.location.search}><IonButton color="light">Cancel</IonButton></Link>
                      <input type="submit" className="submit-enter" />
                      <IonButton color="success" type="submit" onClick={(e) => this.onSubmit(e)}>Login</IonButton>
                    </IonList>
                  </form>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>
    </IonApp>
    )
  }
}

const mapStateToProps = state => {
  let errors = [];
  if (state.auth.errors) {
    errors = Object.keys(state.auth.errors).map(field => {
      return {field, message: state.auth.errors[field]};
    });
  }
  return {
    errors,
    isAuthenticated: state.auth.isAuthenticated,
    global: state.global,
  };
}

const mapDispatchToProps = dispatch => {
  return {
    login: (username, password) => {
      return dispatch(auth.login(username, password));
    },
    setGlobalState: (name, value) => {
      return dispatch(global.setGlobalState(name, value));
    },      
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Login);

