import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Settings from './settings.component';
import {TokenService} from "../services/token-service";
import {getBrowser} from "../helpers/browser-helpers";
import {isAppTypeExtension} from "../helpers/app-types-helpers";

const tokenService = new TokenService();

class Menu extends React.Component {

    constructor(props) {
        super(props);
    }

    changeModeToManual() {
        if(!JSON.parse(this.props.disableManual)) {
            this.props.changeModeToManual();
        }
    }

    changeModeToTimer() {
        this.props.changeModeToTimer();
    }

    openSettings() {
        if(!JSON.parse(localStorage.getItem('offline'))) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <Settings workspaceSettings={this.props.workspaceSettings}/>,
                document.getElementById('mount')
            );
        }
    }

    openUrlPermissions() {
        getBrowser().runtime.openOptionsPage();
    }

    logout() {
        tokenService.logout();
    }

    render() {
        if (this.props.isOpen) {
            return (
                <div>
                    <div className="rectangle"></div>
                    <div className="menu">
                        <span>Entry mode</span>
                        <div onClick={this.changeModeToManual.bind(this)}
                            className={this.props.mode === 'manual' ? "menu_manual-active" : "disabled"}>
                            <img src="./assets/images/manual-hover.png"/>
                            <label className={JSON.parse(this.props.disableManual)? "disable-manual" : ""}>MANUAL</label>
                        </div>
                        <div onClick={this.changeModeToManual.bind(this)}
                             className={this.props.mode !== 'manual' ? "menu_manual-inactive" : "disabled"}>
                            <img src="./assets/images/manual.png"/>
                            <label className={JSON.parse(this.props.disableManual)? "disable-manual" : ""}>MANUAL</label>
                        </div>
                        <div onClick={this.changeModeToTimer.bind(this)}
                            className={this.props.mode === 'timer' ? "menu_timer-active" : "disabled"}>
                            <img src="./assets/images/automatic-hover.png"/>
                            <label>TIMER</label>
                        </div>
                        <div onClick={this.changeModeToTimer.bind(this)}
                             className={this.props.mode !== 'timer' ? "menu_timer-inactive" : "disabled"}>
                            <img src="./assets/images/automatic.png"/>
                            <label>TIMER</label>
                        </div>
                        <hr/>
                        {/*<div>REPORTS</div>*/}
                        <div className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""} onClick={this.openSettings.bind(this)}>SETTINGS</div>
                        <div className={isAppTypeExtension() ?
                                    JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""
                                     : "disabled"}
                             onClick={this.openUrlPermissions.bind(this)}>
                            URL PERMISSIONS
                        </div>
                        <div className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""} onClick={this.logout.bind(this)}>LOG OUT</div>
                    </div>
                </div>
            )
        } else {
            return null;
        }
    }
}

export default Menu;