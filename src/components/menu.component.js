import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Settings from './settings.component';
import {TokenService} from "../services/token-service";
import {getBrowser} from "../helpers/browser-helper";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {WebSocketClient} from "../web-socket/web-socket-client";
import {getAppTypes} from "../enums/applications-types.enum";
import {getEnv} from "../environment";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import WorkspaceList from './workspace-list.component';
import {LocalStorageService} from "../services/localStorage-service";
import {UserService} from "../services/user-service";

const tokenService = new TokenService();
const webSocketClient = new WebSocketClient();
const environment = getEnv();
const htmlStyleHelper = new HtmlStyleHelper();
const localStorageService = new LocalStorageService();
const userService = new UserService();

class Menu extends React.Component {

    constructor(props) {
        super(props);
    }

    setActiveClassToActiveElement() {
        if (this.props.mode === 'timer') {
            document.getElementById('timer').classList.add('active');
            document.getElementById('manual').classList.remove('active');
        } else {
            document.getElementById('manual').classList.add('active');
            document.getElementById('timer').classList.remove('active');
        }
    }

    changeModeToManual() {
        if (this.props.mode === 'manual') return;
        if(!JSON.parse(this.props.disableManual)) {
            this.props.changeModeToManual();
        }
    }

    changeModeToTimer() {
        if (this.props.mode === 'timer') return;
        if(!JSON.parse(this.props.disableAutomatic)) {
            this.props.changeModeToTimer();
        }
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
        htmlStyleHelper.removeDarkModeClassFromBodyElement();
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
            } else {
                webSocketClient.disconnect();
            }
        }
    }

    selectWorkspace(workspaceId) {
        userService.setDefaultWorkspace(workspaceId)
            .then(response => {
                localStorageService.set('activeWorkspaceId', workspaceId);
                if (isAppTypeExtension()) {
                    getBrowser().storage.sync.set({
                        activeWorkspaceId: (workspaceId)
                    });
                }
                this.setState({
                    defaultProjectEnabled: false
                });
                if (isAppTypeExtension()) {
                    getBrowser().extension.getBackgroundPage().restartPomodoro();
                }
                this.props.workspaceChanged();
            })
            .catch(() => {
            });
    }

    render() {
        if (this.props.isOpen) {
            return (
                <div title="">
                    <div className="rectangle"></div>
                    <div className="dropdown-menu">
                        <div className="dropdown-header">Entry mode</div>
                        <a id="manual"
                           className={JSON.parse(this.props.disableManual) ?
                               "dropdown-item disable-manual" : this.props.mode === "manual" ?
                                   "dropdown-item active" : "dropdown-item"}
                           href="#"
                           onClick={this.changeModeToManual.bind(this)}>
                            <span className="menu-manual-img"></span>
                            <span className={JSON.parse(this.props.disableManual) ? "disable-manual" : ""}>Manual</span>
                        </a>
                        <a id="timer"
                           className={this.props.mode === 'timer' ?
                                   "dropdown-item active" : "dropdown-item"}
                           href="#"
                           onClick={this.changeModeToTimer.bind(this)}>
                            <span className="menu-timer-img"></span>
                            <span>Timer</span>
                        </a>
                        <div className="dropdown-divider"></div>
                        <WorkspaceList
                            selectWorkspace={this.selectWorkspace.bind(this)}
                        />
                        <a onClick={this.openSettings.bind(this)}
                           className="dropdown-item"
                           href="#">
                            <span>Settings</span>
                        </a>
                        <a onClick={this.openUrlPermissions.bind(this)}
                           className={isAppTypeExtension() ? "dropdown-item" : "disabled"} href="#">
                            <span className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""}>
                                Integrations
                            </span>
                        </a>
                        <a onClick={this.openWebDashboard.bind(this)}
                           className="dropdown-item" href="#">
                            <span className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""}>
                                Dashboard
                            </span>
                            <span className="menu-img-right"></span>
                        </a>
                        <a onClick={this.logout.bind(this)}
                           className="dropdown-item" href="#">
                            <span className={JSON.parse(localStorage.getItem('offline')) ? "disable-manual" : ""}>
                                Log out
                            </span>
                        </a>
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}

export default Menu;