import React, { Component }  from 'react';
import DrawerContent from '../DrawerContent';


export class DesktopDrawer extends Component {

    render() {
        return (
            <div className="ion-align-self-end side-menu ion-padding-top ion-padding-bottom" slot="end" >
                <DrawerContent isMobile={this.props.isMobile} />
            </div>
        );
    }
};

export default DesktopDrawer;