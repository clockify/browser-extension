import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Settings from './settings.component';
import {TokenService} from "../services/token-service";
import {getBrowser} from "../helpers/browser-helper";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {getAppTypes} from "../enums/applications-types.enum";
import {getEnv} from "../environment";

const tokenService = new TokenService();
const environment = getEnv();

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
        this.disconnectWebSocket();
        tokenService.logout();
    }

    openWebDashboard() {
        if (localStorage.getItem('appType') === getAppTypes().DESKTOP) {
            openExternal(`${environment.home}/dashboard`);
        } else {
            window.open(`${environment.home}/dashboard`, '_blank');
        }
    }

    disconnectWebSocket() {
        if (!JSON.parse(localStorage.getItem('selfHosted_selfHosted'))) {
            if (isAppTypeExtension()) {
                getBrowser().runtime.sendMessage({
                    eventName: "webSocketDisconnect"
                });
            }
        }
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
                        <div className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""}
                             onClick={this.openSettings.bind(this)}>SETTINGS</div>
                        <div className={isAppTypeExtension() ?
                                    JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""
                                     : "disabled"}
                             onClick={this.openUrlPermissions.bind(this)}>
                            INTEGRATIONS
                        </div>
                        <div className={"menu__dashboard"} onClick={this.openWebDashboard.bind(this)}>
                            <p className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""}>
                                DASHBOARD
                            </p>
                            <span className="menu__dashboard__out"></span>
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