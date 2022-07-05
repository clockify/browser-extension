import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Settings from './settings.component';
import {TokenService} from "../services/token-service";
import {getBrowser, isChrome} from "../helpers/browser-helper";
import {getEnv} from "../environment";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import WorkspaceList from './workspace-list.component';
import {WorkspaceService} from "../services/workspace-service";
import {LocalStorageService} from "../services/localStorage-service";
import {UserService} from "../services/user-service";
import WorkspaceChangeConfirmation from './workspace-change-confirmation.component'
import {SettingsService} from "../services/settings-service";
import locales from '../helpers/locales';
import WsChange2FAPopupComponent from "../components/ws-change-2fa-popup.component";

const tokenService = new TokenService();
//const webSocketClient = new WebSocketClient();
const environment = getEnv();
const htmlStyleHelper = new HtmlStyleHelper();
const localStorageService = new LocalStorageService();
const userService = new UserService();
const settingsService = new SettingsService();
const workspaceService = new WorkspaceService();

class Menu extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            workspaceChangeConfirmationIsOpen: false,
            selectedWorkspaceId: null,
            revert: false,
            workspaceNameSelected: "",
            subDomainName: "",
            isOffline: null,
            show2FAPopup: false,
            workspaces: [],
            selectedWorkspace: null,
            previousWorkspace: null,
        }

        // this.onSetWorkspace = this.onSetWorkspace.bind(this);
        this.selectWorkspace = this.selectWorkspace.bind(this);
        this.changeToSubdomainWorkspace = this.changeToSubdomainWorkspace.bind(this);
        this.cancelSubdomainWorkspaceChange = this.cancelSubdomainWorkspaceChange.bind(this);
        this.changeModeToManual = this.changeModeToManual.bind(this);
        this.getWorkspaces = this.getWorkspaces.bind(this);
    }

    componentDidMount() {
        this.getWorkspaces();
    }

    async componentDidUpdate(prevProps) {
        const isOffline = JSON.parse(await localStorage.getItem('offline'));
        if(this.state.isOffline !== isOffline) {
            this.setState({
                isOffline
            });
        }
        if(this.props.workspaceSettings !== prevProps.workspaceSettings) {
            this.getWorkspaces();
        }
    }

    getWorkspaces() {
        workspaceService.getWorkspacesOfUser()
            .then(async response => {
                let data = response.data;
                const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId');
                let selectedWorkspace = data.filter(workspace => workspace.id === activeWorkspaceId)[0];
                this.setState({
                    workspaces: data,
                    selectedWorkspace: selectedWorkspace,
                    previousWorkspace: selectedWorkspace
                })
            })
            .catch(() => {
            });
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
        if (this.props.mode === 'manual' || this.props.manualModeDisabled)
            return;
        if(!JSON.parse(this.props.disableManual)) {
            this.props.changeModeToManual();
        }
    }

    changeModeToTimer() {
        if (this.props.mode === 'timer')
            return;
        if(!JSON.parse(this.props.disableAutomatic)) {
            this.props.changeModeToTimer();
        }
    }

    async openSettings() {
        if(!JSON.parse(await localStorage.getItem('offline'))) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <Settings workspaceSettings={this.props.workspaceSettings}/>,
                document.getElementById('mount')
            );
        }
    }

    openUrlPermissions() {
        if(this.state.isOffline) return;
        getBrowser().runtime.openOptionsPage();
    }

    logout() {
        if(this.state.isOffline) return;
        this.disconnectWebSocket();
        htmlStyleHelper.removeDarkModeClassFromBodyElement();
        tokenService.logout();
        if (!isChrome())
            localStorageService.removeItem('subDomainName');        
    }

    async openWebDashboard() {
        if(this.state.isOffline) return;
        const homeUrl = await localStorageService.get('homeUrl') || environment.home
        window.open(`${homeUrl}/dashboard`, '_blank');   
        if(!isChrome()){
            browser.tabs.create({
                url:`${homeUrl}/dashboard`
              });
        }
    }

    async disconnectWebSocket() {
        const selfHosted = await localStorage.getItem('selfhosted_selfHosted');
        if (!JSON.parse(selfHosted)) {
            getBrowser().runtime.sendMessage({
                eventName: 'webSocketDisconnect'
            });
        }
    }

    selectWorkspace(workspace) {
        this.props.clearEntries();

        const workspaceId = workspace.id;
        const workspaceName = workspace.name

        this.props.beforeWorkspaceChange();

        this.setState(state => ({
            revert: false,
            selectedWorkspaceId: workspaceId,
            workspaceNameSelected: workspaceName,
            previousWorkspace: state.selectedWorkspace,
            selectedWorkspace: workspace
        }))

        userService.setDefaultWorkspace(workspaceId)
            .then(response => {
                const subDomainName = response.headers["sub-domain-name"];
                if (subDomainName) {
                    this.setState({
                        revert: false,
                        workspaceChangeConfirmationIsOpen: true,
                        subDomainName: subDomainName
                    })
                    return;
                }
                localStorageService.set('activeWorkspaceId', workspaceId);
                localStorage.removeItem('preProjectList');
                localStorage.removeItem('preTagsList');
            
                getBrowser().storage.local.set({
                    activeWorkspaceId: (workspaceId)
                });
                
                this.setState({
                    defaultProjectEnabled: false
                });
                
                // getBrowser().extension.getBackgroundPage().restartPomodoro();
                getBrowser().runtime.sendMessage({
                    eventName: 'restartPomodoro'
                });

                this.props.workspaceChanged();
            })
            .catch((error) => {
                console.log(error.response.data.code);
                if(error.response.data.code === 1013){
                    this.setState({
                        show2FAPopup: true
                    });
                }
            });
    }

    cancelSubdomainWorkspaceChange() {
        this.setState({
            revert: true,
            workspaceChangeConfirmationIsOpen: false,
            subDomainName: ''
        })
    }

    changeToSubdomainWorkspace() {
        this.setState({
            revert: false,
            workspaceChangeConfirmationIsOpen: false,
        })

        settingsService.setSubDomainName(this.state.subDomainName);
        this.logout.bind(this)()
    }


    render() {
        const title = this.props.disableManual ? "You have time entry in progress!" :
                        this.props.manualModeDisabled ? locales.DISABLED_MANUAL_MODE : "";
        if (this.props.isOpen) {
            return (
                <div title="">
                    <div className="rectangle"></div>
                    <div className="dropdown-menu">
                        <div className="dropdown-header">{locales.ENTRY_MODE}</div>
                        <a id="manual"
                           className={JSON.parse(this.props.disableManual) || this.props.manualModeDisabled ?
                               "dropdown-item disable-manual" : this.props.mode === "manual" ?
                                   "dropdown-item active" : "dropdown-item"}
                           href="#"
                           onClick={this.changeModeToManual}
                           title={title}
                        >
                            <span className="menu-manual-img"></span>
                            <span className={JSON.parse(this.props.disableManual) ? "disable-manual" : ""}>{locales.MANUAL}</span>
                        </a>
                        <a id="timer"
                           className={this.props.mode === 'timer' ?
                                   "dropdown-item active" : "dropdown-item"}
                           href="#"
                           onClick={this.changeModeToTimer.bind(this)}>
                            <span className="menu-timer-img"></span>
                            <span>{locales.TIMER}</span>
                        </a>
                        <div className="dropdown-divider"></div>
                        <WorkspaceList
                            revert={this.state.revert}
                            selectWorkspace={this.selectWorkspace}
                            workspaces={this.state.workspaces}
                            selectedWorkspace={this.state.selectedWorkspace}
                            previousWorkspace={this.state.previousWorkspace}
                        />
                        <a onClick={this.openSettings.bind(this)}
                           className="dropdown-item"
                           href="#">
                            <span className={this.state.isOffline ? "disable-manual" : ""}>{locales.SETTINGS}</span>
                        </a>
                        <a onClick={this.openUrlPermissions.bind(this)}
                           className="dropdown-item" href="#">
                            <span className={this.state.isOffline ? "disable-manual" : ""}>
                            {locales.INTEGRATIONS}
                            </span>
                        </a>
                        <a onClick={this.openWebDashboard.bind(this)}
                           className="dropdown-item" href="#">
                            <span className={this.state.isOffline ? "disable-manual" : ""}>
                            {locales.DASHBOARD}
                            </span>
                            <span className="menu-img-right"></span>
                        </a>
                        <a onClick={this.logout.bind(this)}
                           className="dropdown-item" href="#">
                            <span className={this.state.isOffline ? "disable-manual" : ""}>
                                {locales.LOG_OUT}
                            </span>
                        </a>
                    </div>
                
                    { this.state.workspaceChangeConfirmationIsOpen && 
                        <WorkspaceChangeConfirmation
                            canceled= {this.cancelSubdomainWorkspaceChange}
                            confirmed={this.changeToSubdomainWorkspace} 
                            workspaceName={this.state.workspaceNameSelected}
                            isChrome={isChrome()}
                        /> 
                    }

                    {   this.state.show2FAPopup && 
                        <WsChange2FAPopupComponent 
                            cancel={() => this.setState({show2FAPopup: false, revert: true})} 
                            workspaceName={this.state.workspaceNameSelected}
                        />
                    }
                    
                </div>
            );
        } else {
            return null;
        }
    }
}

export default Menu;