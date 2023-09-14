import React, { Component }  from 'react';
import { connect } from 'react-redux';
import { ReCaptcha } from 'react-recaptcha-google'
import { 
    IonModal, 
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonButton, 
    IonContent, 
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonList,
    IonNote,
} from '@ionic/react'
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { global } from '../../../../../actions';

export class EntityContact extends Component {

    state = {
        name: '',
        email: '',
        message: '',
        recaptcha: '',
        errors: {},
    }

    constructor(props, context) {
        super(props, context);
        this.onLoadRecaptcha = this.onLoadRecaptcha.bind(this);
        this.verifyCallback = this.verifyCallback.bind(this);
    }

    closeModal = () => {
        this.resetForm();
        this.props.setGlobalState({showcontactmodal: false})
    }

    onWillDismiss = (ev) => {
        this.closeModal();
    }

    submitForm = () => {
        const errors = this.validateForm(this.state);
        if (Object.keys(errors).length !== 0) {
            this.setState({errors: errors});
        } else {
            const message = {
                entityid: this.props.entity.id,
                name: this.state.name,
                email: this.state.email,
                message: this.state.message,
                recaptcha: this.state.recaptcha
            }
            this.props.messageEntity(message).then(() => {
                toast.success('Message sent', {style: {zIndex: '20000000'}});
            });
            setTimeout(this.formSubmitted, 2000);
        }
    }

    formSubmitted = () => {
        this.resetForm();
        this.closeModal();       
    }

    onBlur = (e) => {
        const errors = this.validateForm(this.state);
        const target = e.target.name;
        const existingerrors = {...this.state.errors};
        if (errors[target]) {
            existingerrors[target] = errors[target];
        } else {
            existingerrors[target] = null;
        }
        this.setState({errors: existingerrors});
    }

    onInputChange = (e) => {
        this.setState({[e.target.name]: e.detail.value});   
    };
    
    validateForm = (values) => {
        let errors = {};
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if (!values.name) {
            errors.name = "Please enter your name";
        }
        if (!values.email) {
          errors.email = "Please enter your email";
        } else if (!regex.test(values.email)) {
          errors.email = "Invalid email format";
        }
        if (!values.message) {
            errors.message = "Please enter a message";
        }
        if (!values.recaptcha) {
            errors.recaptcha = "Please click 'I am not a robot'";
        }
        return errors;
    };

    clearErrors = () => {
        this.setState({errors: {}});
    }

    resetForm = () => {
        this.setState({
            name: '',
            email: '',
            message: '',
            recaptcha: '',
            errors: {},
        });
    }

    componentDidMount() {
    if (this.captchaRef) {
        this.captchaRef.reset();
    }
    }
    onLoadRecaptcha() {
        if (this.captchaRef) {
            this.captchaRef.reset();
        }
    }

    verifyCallback(recaptchaToken) {
        // console.log("Recaptcha", recaptchaToken)
        this.setState({recaptcha: recaptchaToken});
        const existingerrors = {...this.state.errors};
        existingerrors.recaptcha = null;
        this.setState({errors: existingerrors});

    }
       
    render() {
        return (
        <IonModal 
            id="message-modal"
            isOpen={this.props.global.showcontactmodal} 
            onWillDismiss={(ev) => this.onWillDismiss(ev)} 
        >
            <Toaster position="top-center"  containerStyle={{top: 20}}/>

            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                    <IonButton onClick={() => this.onWillDismiss()}>Cancel</IonButton>
                    </IonButtons>
                    <IonTitle className="message-title">To: {this.props.entity.name}</IonTitle>
                    <IonButtons slot="end">
                    <IonButton strong={true} type="submit" onClick={() => this.submitForm()}>
                        Send
                    </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={this.submitForm}>
                    <IonList className="ion-no-padding">
                        <IonItem className={this.state.errors.name ? 'ion-no-padding ion-invalid': 'ion-no-padding ion-valid'}>
                            <IonLabel position="stacked">Name</IonLabel>
                            <IonInput name="name" onIonBlur={this.onBlur} onIonChange={this.onInputChange} type="text" placeholder="Your name"/>
                            <IonNote slot="error">{this.state.errors.name}</IonNote>
                        </IonItem>
                        <IonItem className={this.state.errors.email ? 'ion-no-padding ion-invalid': 'ion-no-padding ion-valid'}>
                            <IonLabel position="stacked">Email</IonLabel>
                            <IonInput name="email" onIonBlur={this.onBlur} onIonChange={this.onInputChange} type="text" placeholder="Your email"/>
                            <IonNote slot="error">{this.state.errors.email}</IonNote>
                        </IonItem>
                        <IonItem className={this.state.errors.message ? 'ion-no-padding ion-invalid': 'ion-no-padding ion-valid'}>
                            <IonLabel position="stacked">Message</IonLabel>
                            <IonTextarea name="message" onIonBlur={this.onBlur} onIonChange={this.onInputChange} autoGrow={true} rows="5" type="text" placeholder="Your message" />
                            <IonNote slot="error">{this.state.errors.message}</IonNote>
                        </IonItem>
                        <IonItem className={this.state.errors.recaptcha ? 'ion-no-padding ion-invalid': 'ion-no-padding ion-valid'} 
                            lines="none" 
                            style={{paddingTop: "20px"}}>
                            <ReCaptcha
                                ref={(el) => {this.captchaRef = el;}}
                                size="normal"
                                render="explicit"
                                sitekey={process.env.REACT_APP_GOOGLE_RECAPTCHA_SITE_KEY}
                                name="recaptcha"
                                onloadCallback={this.onLoadRecaptcha}
                                verifyCallback={this.verifyCallback}
                            />
                            <IonNote className="recaptcha-error" slot="error">{this.state.errors.recaptcha}</IonNote>
                        </IonItem>
                    </IonList>
                </form>
            </IonContent>
        </IonModal>
        );
    };
}

export const mapStateToProps = state => {
    return {
      global: state.global,
    }
  }
    
  export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
          return dispatch(global.setGlobalState(globalstate));
      },  
      messageEntity: (message) => {
        return dispatch(global.messageEntity(message));
    },     
  }
  }  
  
  export default connect(mapStateToProps, mapDispatchToProps)(EntityContact);

