import * as React from 'react';
import Menu from './menu.component';
import {getEnv} from '../environment';
import {getAppTypes} from "../enums/applications-types.enum";
import {LocalStorageService} from "../services/localStorage-service";
import {TokenService} from "../services/token-service";
import {isAppTypeDesktop} from "../helpers/app-types-helper";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {UserService} from "../services/user-service";

const environment = getEnv();
const localStorageService = new LocalStorageService();
const tokenService = new TokenService();
const userService = new UserService();

let _interval;
const _sreenshotMessage = "Screenshot recording is enabled. This app can't take screenshots.";
const _sreenshotMessageON = "Screenshot recording is enabled. This app can't take screenshots.";
                          //"Admin has enabled screenshots recording in COING workspace.";
const _sreenshotMessageOFF = "Admin has turned off screenshot recording in COING workspace.";

class Header extends React.Component {

    constructor(props) {
        super(props);

        // console.log('headrr mode', localStorage.getItem('mode'))
        // console.log('headrr localStorage.getItem(manualModeDisabled)', localStorage.getItem('manualModeDisabled'))
        // console.log('headrr localStorage.getItem(modeEnforced)', localStorage.getItem('modeEnforced'))

        this.state = {
            menuOpen: false,
            mode: localStorage.getItem('modeEnforced') ? localStorage.getItem('modeEnforced') : localStorage.getItem('mode'),
            showScreenshotNotification: false,
            screenshotMessage: _sreenshotMessage,
            showScreenshotLink: false
        };

        this.closeMenu = this.closeMenu.bind(this);
        this.showScreenshotNotifications = this.showScreenshotNotifications.bind(this);
        this.processNotifications = this.processNotifications.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
        this.checkScreenshotNotifications = this.checkScreenshotNotifications.bind(this);
    }

    componentDidMount() {
        this.checkScreenshotNotifications();
    }

    checkScreenshotNotifications() {
        if (isAppTypeDesktop()) {
            if (_interval)
                clearInterval(_interval);
            if (this.props.isTrackerPage) {
                this.processNotifications();
                _interval = setInterval(() => {
                    this.processNotifications();
                }, 20000);
            }
        }
    }

    componentWillUnmount() {
        if (_interval)
            clearInterval(_interval);
    }

    processNotifications() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId', null);
        const userId = localStorageService.get('userId', null);
        if (userId) {
            userService.getNotifications(userId)
                .then(response => {
                    let notifications = response.data;
                    notifications.forEach(notification => {
                        const { id, type, status, data } = notification;
                        const { workspaceId, message, title } = data;
                        if (status === 'UNREAD' && activeWorkspaceId === workspaceId && type === 'MONITORING') {
                            const wsNames = message.match(/recording in (\w+)/);
                            const wsName = wsNames.length > 1 ? wsNames[1] : "COING";
                            const on = title === "Screenshots enabled";
                            const msg = on
                                ? _sreenshotMessageON
                                : _sreenshotMessageOFF.replace(/COING/, wsName);
                            this.onBackendScreenshotNotification({
                                workspaceId,
                                userId,
                                on,
                                message: msg
                            })
                            userService.markAsRead(userId, id);
                        }
                    })
                    this.showScreenshotNotifications();
                })
        }
    }

    openMenu() {
        this.setState({
            menuOpen: true
        })
    }

    closeMenu() {
        this.setState({
            menuOpen: false
        })
    }

    changeToManualMode() {
        localStorage.setItem('mode', 'manual');
        this.setState({
            mode: 'manual'
        }, () => {
           this.closeMenu();
           this.props.changeMode('manual');
        });
    }

    changeToTimerMode() {
        localStorage.setItem('mode', 'timer');
        this.setState({
            mode: 'timer'
        }, () => {
           this.closeMenu();
           this.props.changeMode('timer');
        });
    }

    goToClockify() {
        const subDomain = localStorageService.get("subDomainName", null);
        const homeUrl = subDomain ? `https://${subDomain}.${environment.home.split('https://')[1]}` : environment.home;
        if (localStorage.getItem('appType') === getAppTypes().DESKTOP) {
            openExternal(`${homeUrl}/tracker`);
        } else {
            window.open(`${homeUrl}/tracker`, '_blank');
        }
    }

    getScreenshotNotificationInfo() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId', null);
        const userId = localStorageService.get('userId', null);
        const workspaceSettings = localStorageService.get('workspaceSettings')
                ? JSON.parse(localStorageService.get('workspaceSettings'))
                : null;
        let list = localStorageService.get('isScreenshotMessageRed')
                    ? JSON.parse(localStorageService.get('isScreenshotMessageRed'))
                    : [];
        return { activeWorkspaceId, userId, workspaceSettings, list };
    }


    showScreenshotNotifications() {
        const { activeWorkspaceId, userId, workspaceSettings, list } = this.getScreenshotNotificationInfo();
        if (activeWorkspaceId == null ||
            userId == null ||
            workspaceSettings == null ||
            !isAppTypeDesktop()
        ) {
            return;
        }

        let message = _sreenshotMessage;
        let filtered = list.filter(item =>
            item.workspaceId === activeWorkspaceId && 
            item.userId === userId);

        const item = filtered.length > 0 ? filtered[0] : null;
        if (item) {
            if (!item.isClosed) {
                if (workspaceSettings.screenshotsEnabled && !item.turnedOn) {
                    this.setState({
                        showScreenshotNotification: true,
                        screenshotMessage: _sreenshotMessageON,
                        showScreenshotLink: true
                    });
                }
                else if (!workspaceSettings.screenshotsEnabled && item.turnedOn) {
                    this.setState({
                        showScreenshotNotification: false
                    });
                }
                else {
                    message =  item.message;
                    this.setState({
                        showScreenshotNotification: !item.isClosed,
                        screenshotMessage: message,
                        showScreenshotLink: (typeof item.turnedOn === "undefined") ? true : item.turnedOn
                    });
                }
            }
        }
        else {
            if (workspaceSettings.screenshotsEnabled) {
                this.setState({
                    showScreenshotNotification: true,
                    screenshotMessage: _sreenshotMessageON,
                    showScreenshotLink: true
                })
            }    
        }
    }

    onBackendScreenshotNotification(notification) {
        const { activeWorkspaceId, userId, workspaceSettings, list } = this.getScreenshotNotificationInfo();
        let index = list.findIndex(item =>
                item.workspaceId === notification.workspaceId && 
                item.userId === notification.userId);
        if (index >= 0) {
            list[index].isClosed = false;
            list[index].turnedOn = notification.on;
            list[index].message = notification.message;
        } else {
            list.push({ 
                userId: notification.userId,
                workspaceId: notification.workspaceId,
                isClosed: false,
                turnedOn: notification.on,
                message: notification.message
            });
        }
        this.setState({
            showScreenshotNotification: true,
            screenshotMessage: notification.message,
            showScreenshotLink: notification.on
        })

        localStorageService.set(
            'isScreenshotMessageRed',
            JSON.stringify(list),
            getLocalStorageEnums().PERMANENT_PREFIX
        );        
    }

    closeScreenshotNotification() {
        const { activeWorkspaceId, userId, workspaceSettings, list } = this.getScreenshotNotificationInfo();
        if (list.length === 0) {
            list.push({userId: userId, workspaceId: activeWorkspaceId, isClosed: true})
        } else {
            let index = list.findIndex(item =>
                            item.workspaceId === activeWorkspaceId && 
                            item.userId === userId)
            if (index >= 0) {
                list[index].isClosed = true;
            } else {
                list.push({userId: userId, workspaceId: activeWorkspaceId, isClosed: true})
            }
        }

        this.setState({
            showScreenshotNotification: false
        })

        localStorageService.set(
            'isScreenshotMessageRed',
            JSON.stringify(list),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
    }

    goBack() {
        this.props.goBackTo();
    }

    goToDownloadScreenshotsApp() {
        openExternal("https://clockify.me/screenshot-recording-app");
    }

    goToScreenshotsHelp() {
        openExternal(`${environment.home}/help/extra-features/screenshots`);
    }

    beforeWorkspaceChange() {       
        this.setState({
            showScreenshotNotification: false
        })

        if (_interval) {
            clearInterval(_interval);
            _interval = null;
        }

        const { activeWorkspaceId, userId, workspaceSettings, list } = this.getScreenshotNotificationInfo();
        let index = list.findIndex(item =>
                item.workspaceId === activeWorkspaceId && 
                item.userId === userId  &&
                !item.isClosed);
        if (index >= 0) {
            return; // has unShown
        }

        if (workspaceSettings.screenshotsEnabled) {
            // kad se vrati na taj ws, nek nadje poruku
            this.onBackendScreenshotNotification({
                workspaceId: activeWorkspaceId,
                userId,
                on: true,
                message: _sreenshotMessage
            });
        }
        this.setState({
            showScreenshotNotification: false
        })
    }

    workspaceChange() {
        this.props.workspaceChanged();
    }

    handleRefresh() {
        this.props.handleRefresh(true);
    }

    render() {
        return (
            <div>
                <div className={this.state.menuOpen ? "invisible-menu" : "disabled"}
                     onClick={this.closeMenu.bind(this)}>
                </div>
                <div className={ this.props.isOffline ? "header-offline" : "disabled"}>
                    Offline
                </div>
                <div className="header">
                    <div className="self-hosted-url__logo">
                        <a onClick={this.goToClockify.bind(this)}>
                            <span className="logo"></span>
                        </a>
                    </div>
                    <div>
                        <div onClick={this.handleRefresh}
                             title="Refresh"
                             className={this.props.showSync ?
                                 "header-sync" : "disabled"}>
                        </div>
                        <div className={this.props.showActions ? "actions" : "disabled"}
                             title="Settings"
                             onClick={this.openMenu.bind(this)}>
                            <Menu
                                isOpen={this.state.menuOpen}
                                mode={this.state.mode}
                                manualModeDisabled={JSON.parse(localStorage.getItem('manualModeDisabled'))}
                                changeModeToManual={this.changeToManualMode.bind(this)}
                                changeModeToTimer={this.changeToTimerMode.bind(this)}
                                disableManual={this.props.disableManual}
                                disableAutomatic={this.props.disableAutomatic}
                                workspaceSettings={this.props.workspaceSettings}
                                beforeWorkspaceChange= {this.beforeWorkspaceChange.bind(this)}
                                workspaceChanged={this.workspaceChange.bind(this)}
                            />
                        </div>
                        <span className={this.props.backButton ? "header-back" : "disabled"}
                              onClick={this.goBack.bind(this)}>Back</span>
                    </div>
                </div>
                {this.state.showScreenshotNotification && 
                <div className={this.state.showScreenshotNotification ? "screenshot-notification" : "disabled"}>
                    <div className="screenshot-notification__info_and_close_button">
                        <span className="screenshot-notification__info">
                            {this.state.screenshotMessage}
                            {this.state.showScreenshotLink &&
                                <a onClick={this.goToDownloadScreenshotsApp.bind(this)}
                                    className = "screenshot-notification__action_buttons--help">
                                    Download screenshots recording app 
                                </a>
                            }
                        </span>
                        <span className="screenshot-notification__close" 
                            onClick={this.closeScreenshotNotification.bind(this)}>
                        </span>
                    </div>
                </div>}
                <hr className={!tokenService.isLoggedIn() ? "header__break" : "disabled"}/>
            </div>
        )
    }
}

export default Header;