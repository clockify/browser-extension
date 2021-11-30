import * as React from 'react';
import Header from './header.component';
import StartTimer from './start-timer.component';
import moment, {duration} from 'moment';
import TimeEntryList from './time-entry-list.component';
import TimeEntryListNotSynced from './time-entry-list-notsynced.component';
import 'moment-duration-format';
import * as ReactDOM from 'react-dom';
import EditForm from './edit-form.component';
import RequiredFields from './required-fields.component';
import {isOffline} from "./check-connection";
import packageJson from '../../package';
import 'babel-polyfill';
import {getIconStatus} from "../enums/browser-icon-status-enum";
import {Application} from "../application";
import {TimeEntryService} from "../services/timeEntry-service";
import {WorkspaceService} from "../services/workspace-service";
import {ProjectService} from "../services/project-service";
import {getBrowser} from "../helpers/browser-helper";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {getWebSocketEventsEnums} from "../enums/web-socket-events.enum";
//import {WebSocketClient} from "../web-socket/web-socket-client";
import {LocalStorageService} from "../services/localStorage-service";
import {getWorkspacePermissionsEnums} from "../enums/workspace-permissions.enum";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import Toaster from "./toaster-component";
import {getManualTrackingModeEnums} from "../enums/manual-tracking-mode.enum";
import {debounce} from "lodash";
import Logger from './logger-component'
import {UserService} from "../services/user-service";
import {offlineStorage} from '../helpers/offlineStorage';

const projectService = new ProjectService();
const userService = new UserService();

//const webSocketClient = new WebSocketClient();
const localStorageService = new LocalStorageService();
const messages = [
    'TIME_ENTRY_STARTED',
    'TIME_ENTRY_STOPPED',
    'TIME_ENTRY_DELETED',
    'TIME_ENTRY_UPDATED',
    'TIME_ENTRY_CREATED',
    'WORKSPACE_SETTINGS_UPDATED',
    'CHANGED_ADMIN_PERMISSION'
];
const timeEntryService = new TimeEntryService();
const workspaceService = new WorkspaceService();
const htmlStyleHelper = new HtmlStyleHelper();
let websocketHandlerListener = null;

let _webSocketConnectExtensionDone = false;

let _checkOfflineMS = 5000; 
let _timeoutCheckOffline = null;

let _receiveOfflineEventsName;

let _logLines = [];
let _loggerInterval = null;
const _withLogger = false;

let _networkHandlerListener;
const networkMessages = [
    'STATUS_CHANGED_ONLINE',
    'STATUS_CHANGED_OFFLINE',
];

class HomePage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            selectedTimeEntry: {},
            timeEntries: [],
            dates: {},
            loadMore: true,
            pageCount: 0,
            inProgress: null,
            loading: false,
            workspaceSettings: { 
                timeTrackingMode: getManualTrackingModeEnums().DEFAULT,
                projectPickerSpecialFilter : false,
                forceProjects: false
            },
            features: [],
            mode: localStorage.getItem('mode') ? localStorage.getItem('mode') : 'timer',
            manualModeDisabled: false,
            pullToRefresh: false,
            projects: [],
            tasks: [],
            userSettings: JSON.parse(localStorage.getItem('userSettings')),
            durationMap: {},
            isUserOwnerOrAdmin: false,
            isOffline: isOffline()
        };

        this.application = new Application(localStorageService.get('appType'));

        this.initialJob = this.initialJob.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.loadMoreEntries = this.loadMoreEntries.bind(this);
        this.getEntryFromPomodoroAndIdleEvents = this.getEntryFromPomodoroAndIdleEvents.bind(this);
        this.saveAllOfflineEntries = this.saveAllOfflineEntries.bind(this);

        this.connectionHandler = this.connectionHandler.bind(this);
        this.handleRefresh = this.handleRefresh.bind(this);
        this.checkOffline = this.checkOffline.bind(this);
        this.checkReload = this.checkReload.bind(this);
        this.reloadOnlineByEvent = debounce(this.reloadOnlineByEvent, 5000);
        this.reloadOnlineByChecking = debounce(this.reloadOnlineByChecking, 3000);
        this.reloadOffline = debounce(this.reloadOffline, 1000);

        this.loggerRef = React.createRef();       
        this.displayLog = this.displayLog.bind(this);
        this.workspaceChanged = this.workspaceChanged.bind(this);
        this.changeMode = this.changeMode.bind(this);

        offlineStorage.load();

        if (!isAppTypeExtension() && window.ipcRenderer) {
            window.ipcRenderer.on('online-status-changed', (event, message) => { 
                this.log("online-status-changed => " + message);
                this.connectionHandler({type: message});
            });
        }        
    }
    
    log(msg) {
        if (_withLogger)
            _logLines.push(msg);
    }

    displayLog() {
        const len = _logLines.length;
        if (this.loggerRef && this.loggerRef.current) {
            for (var i=0; i < len; i++) {
                const msg = _logLines.shift();
                this.loggerRef.current.log(msg);
            }
        }
    }

    componentDidMount() {
        this.log("componentDidMount");
        localStorage.setItem('appVersion', packageJson.version);
        document.addEventListener('backbutton', this.handleBackButton, false);
        document.addEventListener('scroll', this.handleScroll, false);
        htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();

        if (isAppTypeExtension()) {
            _receiveOfflineEventsName = "receivingOfflineEvents";
        }
        else {
            _receiveOfflineEventsName = "receivingOfflineEventsDesktop";
        }
       
        this.log(`receive Offline Events: ${localStorageService.get(_receiveOfflineEventsName, 'false')}`);

        this.getWorkspaceSettings()
            .then(response => {
                this.initialJob();
            })
            .catch(error => {
                this.initialJob(); // offLine mode
            });
        
        if (_withLogger)
            _loggerInterval = setInterval(() => { this.displayLog() }, 3000);
       
    }

    initialJob() {
        if (localStorageService.get(_receiveOfflineEventsName, 'false') !== 'true') {
            this.log('=> polling offline mode')
            if (_timeoutCheckOffline)
                clearTimeout(_timeoutCheckOffline);
            _timeoutCheckOffline = setTimeout(() => this.checkOffline(), 3000);
        }

        if (!websocketHandlerListener)
            this.webSocketMessagesHandler();

        if (!_networkHandlerListener)
            this.networkMessagesHandler();

        if (isAppTypeExtension()) {
            if (!_webSocketConnectExtensionDone) {
                this.enableAllIntegrationsButtonIfNoneIsEnabled();
                this.enableTimerShortcutForFirstTime();
                if (!isOffline()) {
                    getBrowser().runtime.sendMessage({
                        eventName: 'webSocketConnect'
                    });
                    _webSocketConnectExtensionDone = true;
                }
                this.getEntryFromPomodoroAndIdleEvents();
            }
        } 

        if (!isOffline()) {
            this.setIsUserOwnerOrAdmin();
        }
        else {
            this.handleRefresh();
        }        
    }

    workspaceChanged() {
        this.getWorkspaceSettings()
            .then(response => {
                this.handleRefresh();
                if (this.header)
                    this.header.checkScreenshotNotifications();
            })
            .catch(error => {
            });
    }

    componentWillUnmount() {
        this.log("componentWillUnmount");
        if (_timeoutCheckOffline) {
            clearTimeout(_timeoutCheckOffline);
            _timeoutCheckOffline = null;
        }

        getBrowser().runtime.onMessage.removeListener(_networkHandlerListener);
        _networkHandlerListener = null;

        getBrowser().runtime.onMessage.removeListener(websocketHandlerListener);
        websocketHandlerListener = null;

        document.removeEventListener('scroll', this.handleScroll, false);
        document.removeEventListener('backbutton', this.handleBackButton, false);

        this.log("componentWillUnmount done");
        if (_loggerInterval)
            clearInterval(_loggerInterval);
    }

    reloadOnlineByEvent() {
        this.getWorkspaceSettings()
            .then(response => {
                this.initialJob();
            })
            .catch(error => {
            });        
    }

    reloadOnlineByChecking() {
        this.getWorkspaceSettings()
            .then(response => {
                this.initialJob();
            })
            .catch(error => {
            });        
    }

    reloadOffline() {
        this.handleRefresh();
    }

    connectionHandler(event) {
        if (_timeoutCheckOffline) {
            clearTimeout(_timeoutCheckOffline);
            _timeoutCheckOffline = null;
        }
        this.log(`handler event --------------> '${event.type}'`);
        localStorageService.set(_receiveOfflineEventsName, 'true', getLocalStorageEnums().PERMANENT_PREFIX);
        let isOff;
        if (event.type === "online") {
            localStorage.setItem('offline', 'false');
            isOff = false;
        } 
        else {
            localStorage.setItem('offline', 'true');
            isOff = true;
        }

        if (isOff)
            this.reloadOffline();
        else
            this.reloadOnlineByEvent();
    }

    checkOffline() {
       // axios call, just to check if online/offline
       timeEntryService.healthCheck()
            .then(response => {
                this.checkReload()
            })
            .catch(error => {
                this.checkReload()
            });
    }

    checkReload() {
        const isOff = isOffline();
        this.log('checkReload ' + (isOff ? 'offLine' : 'onLine'));

        if (this.state.isOffline !== isOff) {
            if (isOff) {
                this.reloadOffline();
                if (_timeoutCheckOffline)
                    clearTimeout(_timeoutCheckOffline);
                _timeoutCheckOffline = setTimeout(() => this.checkOffline(), _checkOfflineMS);       
            }
            else {
                this.reloadOnlineByChecking();
                if (_timeoutCheckOffline)
                    clearTimeout(_timeoutCheckOffline);
                _timeoutCheckOffline = setTimeout(() => this.checkOffline(), _checkOfflineMS);
            }
        }
        else {
            if (_timeoutCheckOffline)
                clearTimeout(_timeoutCheckOffline);
            _timeoutCheckOffline = setTimeout(() => this.checkOffline(), _checkOfflineMS);       
        }
    }


    getEntryFromPomodoroAndIdleEvents() {
        getBrowser().runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.eventName === 'pomodoroEvent' || request.eventName === 'idleEvent') {
                if (request.timeEntry !== null) {
                    if (this.start)
                        this.start.getTimeEntryInProgress();
                } else {
                    if (request.eventName === 'idleEvent') {
                        if (this.start)
                            this.start.setTimeEntryInProgress(null);
                    }
                    this.getTimeEntries();
                }    
            }
        });
    }

    setIsUserOwnerOrAdmin() {
        if (!isOffline()) {
            workspaceService.getPermissionsForUser().then(workspacePermissions => {
                // console.log('workspacePermissions', workspacePermissions)
                const isUserOwnerOrAdmin = workspacePermissions.filter(permission =>
                    permission.name === getWorkspacePermissionsEnums().WORKSPACE_OWN ||
                    permission.name === getWorkspacePermissionsEnums().WORKSPACE_ADMIN
                ).length > 0;
                this.setState({
                    isUserOwnerOrAdmin
                }, () => {
                    localStorageService.set('isUserOwnerOrAdmin', isUserOwnerOrAdmin);
                    this.handleRefresh(true);
                });
            });
        }
    }

    enableTimerShortcutForFirstTime() {
        const userId = localStorageService.get('userId');
        let timerShortcutFromStorage =
            localStorageService.get('timerShortcut') ? JSON.parse(localStorageService.get('timerShortcut')) : [];

        if (
            timerShortcutFromStorage.length === 0 ||
            (timerShortcutFromStorage.length > 0 &&
                timerShortcutFromStorage.filter(
                    timerShortcut => timerShortcut && timerShortcut.userId === userId).length === 0
                )
        ) {
            timerShortcutFromStorage.push({userId: userId, enabled: true});

            localStorageService.set(
                'timerShortcut',
                JSON.stringify(timerShortcutFromStorage),
                getLocalStorageEnums().PERMANENT_PREFIX
            );
        }
    }

    webSocketMessagesHandler() {
        websocketHandlerListener = (request, sender, sendResponse) => {
            if (messages.includes(request.eventName)) {
                this.setState({
                    mode: 'timer',
                    pageCount: 0
                }, () => {
                    switch (request.eventName) {
                        case getWebSocketEventsEnums().TIME_ENTRY_STARTED:
                            this.log('TIME_ENTRY_STARTED')
                            timeEntryService.getEntryInProgress()
                                .then(response => {
                                    this.start.setTimeEntryInProgress(response.data[0]);
                                });
                            break;
                        case getWebSocketEventsEnums().TIME_ENTRY_CREATED:
                            this.getTimeEntries();
                            break;
                        case getWebSocketEventsEnums().TIME_ENTRY_STOPPED:
                            this.start.setTimeEntryInProgress(null);
                            this.getTimeEntries();
                            break;
                        case getWebSocketEventsEnums().TIME_ENTRY_UPDATED:
                            timeEntryService.getEntryInProgress()
                                .then(response => {
                                    this.start.setTimeEntryInProgress(response.data[0]);
                                });
                            this.getTimeEntries();
                            break;
                        case getWebSocketEventsEnums().TIME_ENTRY_DELETED:
                            timeEntryService.getEntryInProgress()
                                .then(response => {
                                    this.start.setTimeEntryInProgress(response.data[0]);
                                });
                            this.getTimeEntries();
                            break;
                        case getWebSocketEventsEnums().WORKSPACE_SETTINGS_UPDATED: 
                            this.workspaceChanged();
                            break;
                        case getWebSocketEventsEnums().CHANGED_ADMIN_PERMISSION:
                            this.setIsUserOwnerOrAdmin();
                            break;
                    }
                });
            }
        };

        getBrowser().runtime.onMessage.addListener(websocketHandlerListener);
    }

    networkMessagesHandler() {
        _networkHandlerListener = (request, sender, sendResponse) => {
            if (networkMessages.includes(request.eventName)) {
                switch (request.eventName) {
                    case 'STATUS_CHANGED_ONLINE':
                        this.log('STATUS_CHANGED_ONLINE')
                        this.connectionHandler({type: 'online'});
                        break;
                    case 'STATUS_CHANGED_OFFLINE':
                        this.log('STATUS_CHANGED_OFFLINE')
                        this.connectionHandler({type: 'offline'});
                        break;
                }
            }
        };

        getBrowser().runtime.onMessage.addListener(_networkHandlerListener);
    }

    saveAllOfflineEntries() {
        if (!isOffline()) {
            let timeEntries = offlineStorage.timeEntriesOffline;
            timeEntries.map(entry => {
                const customFields = entry.customFieldsValues.map(cf => ({
                    customFieldId: cf.customFieldId, //wsCustomField.id, 
                    sourceType: 'TIMEENTRY',
                    value: cf.value
                }))
                timeEntryService.createEntry(
                    entry.workspaceId,
                    entry.description,
                    entry.timeInterval.start,
                    entry.timeInterval.end,
                    entry.projectId,  // null
                    entry.taskId, // null
                    entry.tagIds || [],
                    entry.billable,
                    customFields
                ).then(response => {
                    let timeEntries = offlineStorage.timeEntriesOffline;
                    if (timeEntries.findIndex(entryOffline => entryOffline.id === entry.id) > -1) {
                        timeEntries.splice(timeEntries.findIndex(entryOffline => entryOffline.id === entry.id), 1);
                    }
                    offlineStorage.timeEntriesOffline = timeEntries;
                })
                .catch(error => {
                    if (error.request.status === 403) {
                        const response = JSON.parse(error.request.response)
                        if (response.code === 4030) {
                            // setTimeout(() => this.showMessage.bind(this)(response.message, 10), 1000)
                        } 
                    }
                });
            });
            offlineStorage.timeEntryInOffline = null;
        }
    }

    handleBackButton() {
        if (!document.getElementById('description')) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(<HomePage/>, document.getElementById('mount'));
        } else {
            navigator.app.exitApp();
        }
    }

    getWorkspaceSettings() {
        const userId = localStorage.getItem('userId');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId')
        if (!isOffline()) {
            userService.getUserRoles(activeWorkspaceId, userId)
                .then(response => {
                    if (response && response.data && response.data.userRoles) {
                        const { userRoles } = response.data;
                        // console.log('getUserRoles', userRoles)
                        getBrowser().storage.local.set({
                            userRoles
                        });
                    }
                    else {
                        console.log('getUserRoles problem')
                    }
                })
                .catch((error) => {
                    console.log("getUserRoles() failure");
                });
        }

        return workspaceService.getWorkspaceSettings()
            .then(response => {
                let { workspaceSettings, features } = response.data;
                //console.log('workspaceSettings, features', { workspaceSettings, features })
                workspaceSettings.projectPickerSpecialFilter = this.state.userSettings.projectPickerTaskFilter;
                if (!workspaceSettings.hasOwnProperty('timeTrackingMode')) {
                    workspaceSettings.timeTrackingMode = getManualTrackingModeEnums().DEFAULT;
                }
                const manualModeDisabled = workspaceSettings.timeTrackingMode === getManualTrackingModeEnums().STOPWATCH_ONLY;
                this.setState({
                    workspaceSettings,
                    features,
                    manualModeDisabled,
                    mode: manualModeDisabled ? 'timer' : this.state.mode,
                }, () => {
                    localStorageService.set('modeEnforced', this.state.mode); // for usage in edit-forms
                    localStorageService.set('manualModeDisabled', JSON.stringify(this.state.manualModeDisabled)); // for usage in header
                    workspaceSettings = Object.assign(workspaceSettings, { 
                        features: { 
                            customFields: features.some(feature => feature === "CUSTOM_FIELDS")
                        }
                    });
                    localStorageService.set("workspaceSettings",  JSON.stringify(workspaceSettings));
                    offlineStorage.userHasCustomFieldsFeature = workspaceSettings.features.customFields;
                    offlineStorage.activeBillableHours = workspaceSettings.activeBillableHours;
                    offlineStorage.onlyAdminsCanChangeBillableStatus = workspaceSettings.onlyAdminsCanChangeBillableStatus;
                    return Promise.resolve(true);
                });
                   
            })
            .catch((error) => {
                this.log("getWorkspaceSettings() failure");
                return Promise.reject(true);
            });
    }

    getTimeEntries(reload) {
        if (!isOffline()) { // shouldn't use this.state.isOffline here
            this.log('service.getTimeEntries()');
            timeEntryService.getTimeEntries(reload ? 0 : this.state.pageCount)
                .then(response => {
                    const timeEntries =
                        response.data.timeEntriesList.filter(entry => entry.timeInterval.end);
                    const durationMap = response.data.durationMap;
                    this.setState({
                        timeEntries: this.groupEntries(timeEntries, durationMap),
                        durationMap: durationMap,
                        ready: true,
                        isOffline: false   // should set isOffline here
                    });
                })
                .catch((error) => {
                    this.setState({
                        isOffline: isOffline()
                    });
                });
        } else {
            this.setState({
                timeEntries: offlineStorage.timeEntriesOffline.length > 0 ?
                    this.groupEntries(offlineStorage.timeEntriesOffline)
                    : [],
                ready: true,
                isOffline: true   // should set isOffline here
            })
        }
        if (reload || this.state.pageCount === 0) {
            htmlStyleHelper.scrollToTop();
            // ReactDOM.render(<HomePage/>, document.getElementById('mount'));
        }
    }


    groupEntries(timeEntries, durationMap) {
        let dates = [];
        const trackTimeDownToSeconds =
            typeof this.state.workspaceSettings.trackTimeDownToSecond !== "undefined" ?
                this.state.workspaceSettings.trackTimeDownToSecond :
                JSON.parse(localStorageService.get("workspaceSettings")).trackTimeDownToSecond;

        if (timeEntries.length > 0) {
            this.groupTimeEntriesByDays(timeEntries, trackTimeDownToSeconds, dates);
        }
        const formatedDurationMap = this.formatDurationMap(durationMap);

        dates = dates.map(day => {
            let dayDuration = duration(0);
            if (durationMap) {
                dayDuration = formatedDurationMap[day];
            } else {
                timeEntries.filter(entry => entry.start === day).map(entry => {
                    dayDuration = dayDuration + duration(entry.timeInterval.duration);
                });
            }
            return day + "-" + duration(dayDuration).format(
                trackTimeDownToSeconds ? 'HH:mm:ss' : 'h:mm', {trim: false}
            );
        });

        this.setState({
            dates: dates
        });

        return timeEntries;
    }

    groupTimeEntriesByDays(timeEntries, trackTimeDownToSeconds, dates) {
        timeEntries.map(timeEntry => {
            if (moment(timeEntry.timeInterval.start).isSame(moment(), 'day')) {
                timeEntry.start = 'Today';
            } else {
                timeEntry.start = moment(timeEntry.timeInterval.start).format('ddd, Do MMM');
            }

            if (!trackTimeDownToSeconds) {
                const diffInSeconds = moment(timeEntry.timeInterval.end)
                    .diff(timeEntry.timeInterval.start) / 1000;
                if (diffInSeconds%60 > 0) {
                    timeEntry.timeInterval.end =
                        moment(timeEntry.timeInterval.end).add(60 - diffInSeconds%60, 'seconds');
                }
            }

            timeEntry.duration =
                duration(moment(timeEntry.timeInterval.end)
                    .diff(timeEntry.timeInterval.start))
                    .format(trackTimeDownToSeconds ? 'HH:mm:ss' : 'h:mm', {trim: false});
            if (dates.indexOf(timeEntry.start) === -1) {
                dates.push(timeEntry.start);
            }
        });
    }

    formatDurationMap(durationMap) {
        let formatedDurationMap = {};
        let formatedKey;
        for (let key in durationMap) {
            formatedKey = moment(key).isSame(moment(), 'day') ?
                'Today' : moment(key).format('ddd, Do MMM');
            formatedDurationMap[formatedKey] = durationMap[key];
        }

        return formatedDurationMap;
    }

    handleScroll(event) {
        if (!isOffline()) {
            this.log('>>>>> handleScroll')
        }

        if (event.srcElement.body.scrollTop + window.innerHeight >
            event.srcElement.body.scrollHeight - 100 &&
            this.state.loadMore && !this.state.loading &&
            !isOffline()) {

            this.loadMoreEntries();
        }
    }

    loadMoreEntries() {
        this.setState({
            pageCount: this.state.pageCount + 1,
            loading: true
        }, () => {
            timeEntryService.getTimeEntries(this.state.pageCount)
                .then(response => {
                    const data = response.data;
                    const entries = data.timeEntriesList.filter(entry => entry.timeInterval.end);
                    const durationMap = data.durationMap;
                    const newDurationMap = this.concatDurationMap(this.state.durationMap, durationMap);
                    this.setState({
                        timeEntries: this.groupEntries(
                            this.state.timeEntries.concat(entries),
                            newDurationMap
                        ),
                        durationMap: newDurationMap,
                        loading: false
                    }, () => {
                        if (this.state.timeEntries.length === data.allEntriesCount) {
                            this.setState({
                                loadMore: false
                            })
                        }
                    });
                })
                .catch(() => {
                });
        })
    }

    concatDurationMap(oldDurationMap, newDurationMap) {
        let durationMap = {};

        for (let key in oldDurationMap) {
            durationMap[key] = oldDurationMap[key];
        }

        for (let key in newDurationMap) {
            if (!durationMap[key]) {
                durationMap[key] = newDurationMap[key];
            }
        }

        return durationMap;

    }

    changeMode(mode) {
        this.setState({
            mode: mode
        }, () => {
            // console.log('!!!!! menjam mode in home', mode)
            localStorage.setItem('mode', mode);
        })
    }

    inProgress(inProgress) {
        this.setState({
            inProgress: inProgress
        }, () => {
            localStorage.setItem('inProgress', !!inProgress);
            localStorage.setItem('timeEntryInProgress', JSON.stringify(inProgress));
        })
    }

    endStartedAndStart(timeEntry) {
        if (isOffline()) {

            if (localStorage.getItem('inProgress') && JSON.parse(localStorage.getItem('inProgress'))) {
                this.start.setTimeEntryInProgress(null); 
            }

            if (offlineStorage.timeEntryInOffline) {
                const entry = offlineStorage.timeEntryInOffline;
                if (entry) {
                    let timeEntries = this.timeEntriesOffline;
                    entry.timeInterval.end = moment();
                    timeEntries.push(entry);
                    offlineStorage.timeEntriesOffline = timeEntries;
                }
            }

            let timeEntryNew = {
                id: offlineStorage.timeEntryIdTemp,
                description: timeEntry.description,
                timeInterval: {start: moment()},
                projectId: timeEntry.projectId,
                taskId: timeEntry.task ? timeEntry.task.id : null,
                tagIds: timeEntry.tags ? timeEntry.tags.map(tag => tag.id) : [],
                billable: timeEntry.billable,
                customFieldValues: offlineStorage.customFieldValues // generated from wsCustomFields
            };

            offlineStorage.timeEntryInOffline = timeEntryNew;
            this.start.setTimeEntryInProgress(timeEntryNew);
            this.handleRefresh();
        } 
        else {
            timeEntryService.stopEntryInProgress(moment())
                .then(() => {
                    if (isAppTypeExtension()) {
                        getBrowser().extension.getBackgroundPage().removeIdleListenerIfIdleIsEnabled();
                        getBrowser().extension.getBackgroundPage().setTimeEntryInProgress(null);
                    }
                    this.getTimeEntries(); 
                    
                    timeEntryService.createEntry(
                        timeEntry.workspaceId,
                        timeEntry.description,
                        moment(),
                        null,
                        timeEntry.projectId,
                        timeEntry.task ? timeEntry.task.id : null,
                        timeEntry.tags ? timeEntry.tags.map(tag => tag.id) : [],
                        timeEntry.billable
                    ).then(response => {
                        let data = response.data;
                        this.start.getTimeEntryInProgress();
                        if (isAppTypeExtension()) {
                            getBrowser().extension.getBackgroundPage().addIdleListenerIfIdleIsEnabled();
                            getBrowser().extension.getBackgroundPage().setTimeEntryInProgress(data);
                        }
                    }).catch(() => {});
                })
                .catch(() => {
                });
        }
    }

    checkRequiredFields(timeEntry) {
        const {forceProjects, forceTasks, forceTags, forceDescription} = this.state.workspaceSettings;
        const {mode, inProgress} = this.state;
        if (isOffline()) {
            this.endStartedAndStart(timeEntry);
        } 
        else if (forceDescription &&
            (inProgress.description === "" || !inProgress.description)) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"description"}
                                mode={mode} 
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        }
        else if (forceProjects && !inProgress.projectId) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"project"}
                                mode={mode} 
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        }
        else if (forceTasks && !inProgress.task) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"task"}
                                mode={mode} 
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        }
        else if (forceTags &&
            (!this.state.timeEntry.tags || !this.state.timeEntry.tags.length > 0)) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"tags"}
                                mode={mode} 
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        }
        else {
            this.endStartedAndStart(timeEntry);
        }
    }

    goToEdit() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(
            <EditForm changeMode={this.changeMode}
                      timeEntry={this.state.inProgress}
                      workspaceSettings={this.state.workspaceSettings}
                      timeFormat={this.state.userSettings.timeFormat}
                      userSettings={this.state.userSettings}
            />, document.getElementById('mount')
        );
    }

    continueTimeEntry(timeEntry) {
        if (this.state.inProgress) {
            this.checkRequiredFields(timeEntry);
        } else {
            if (isOffline()) {
                let timeEntryOffline = {
                    id: offlineStorage.timeEntryIdTemp,
                    description: timeEntry.description,
                    timeInterval: {
                        start: moment()
                    },
                    billable: timeEntry.billable,
                    customFieldValues: offlineStorage.customFieldValues, // generated from wsCustomFields
                    loadMore: false
                };

                offlineStorage.timeEntryInOffline = timeEntryOffline;
                this.start.setTimeEntryInProgress(timeEntryOffline);
            } else {
                timeEntryService.createEntry(
                    timeEntry.workspaceId,
                    timeEntry.description,
                    moment(),
                    null,
                    timeEntry.projectId,
                    timeEntry.task ? timeEntry.task.id : null,
                    timeEntry.tags ? timeEntry.tags.map(tag => tag.id) : [],
                    timeEntry.billable,
                    offlineStorage.customFieldValues // generated from wsCustomFields
                ).then(response => {
                    let data = response.data;
                    this.start.getTimeEntryInProgress();
                    if (isAppTypeExtension()) {
                        getBrowser().extension.getBackgroundPage().addIdleListenerIfIdleIsEnabled();
                        getBrowser().extension.getBackgroundPage().addPomodoroTimer();
                        getBrowser().extension.getBackgroundPage().setTimeEntryInProgress(data);
                    }
                    this.application.setIcon(getIconStatus().timeEntryStarted);
                }).catch(() => {});
            }
        }
    }
    
    handleRefresh(check=false) {
        if (check) {
            timeEntryService.getEntryInProgress()
                .then(response => {
                    this.saveAllOfflineEntries();
                    this.reloadData();
                })
                .catch(error => {
                    this.reloadData();
                });
        }
        else {
            if (!isOffline()) {
                this.saveAllOfflineEntries();
                this.reloadData();
            }
            else {
                this.reloadData();
            }
        }
    }

    reloadData(reload=false) {
        this.log('reloadData ' + (reload ? 'mount (why without unmount?)': ''));
        if (!isOffline()) {
            this.setState({
                pageCount: 0
            }, () => {
                this.getTimeEntries(reload);
            });
            if (this.start) {
                this.start.getTimeEntryInProgress();
            }
        } else {
            this.getTimeEntries(reload);
        }
    }

    enableAllIntegrationsButtonIfNoneIsEnabled() {
        getBrowser().storage.local.get('permissions', (result) => {
            const { permissions } = result;
            const userId = localStorage.getItem('userId');

            if (permissions && permissions.length > 0) {
                const permissionForUser = permissions.filter(permission => permission.userId === userId);
                if (permissionForUser.length > 0 && 
                    permissionForUser[0].permissions.filter(p => !p.isCustom).length > 0) {
                        return;
                    }
            }
            this.setClockifyOriginsToStorage(userId);
        });

    }

    setClockifyOriginsToStorage(userId) {
        fetch("integrations/integrations.json")
            .then(response => response.json())
            .then(clockifyOrigins => {
                getBrowser().storage.local.get('permissions', (result) => {
                    const permissionsForStorage = result.permissions ? result.permissions : [];
                    let arr = permissionsForStorage.filter(permission => permission.userId === userId);
                    let permissionForUser;
                    if (arr.length === 0) {
                        permissionForUser = {
                            userId,
                            permissions: []
                        }
                        permissionsForStorage.push(permissionForUser);
                    }
                    else {
                        permissionForUser = arr[0];
                    }

                    for (let key in clockifyOrigins) {
                        permissionForUser.permissions.push({
                            domain: key,
                            isEnabled: true,
                            script: clockifyOrigins[key].script,
                            name: clockifyOrigins[key].name,
                            isCustom: false
                        });
                    }   
                     
                    getBrowser().storage.local.set({permissions: permissionsForStorage});
                });
            });
    }

    showMessage(message, n) {
        this.toaster.toast('info', message, n||2);
    }

    render() {
        if (!this.state.ready) {
            return null;
        } else {
            this.log("HomePage render")
            const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
            const timeEntriesOffline = offlineStorage.timeEntriesOffline
                    .filter(timeEntry => !timeEntry.workspaceId || timeEntry.workspaceId === activeWorkspaceId);
            const { inProgress, isOffline, mode, 
                    workspaceSettings,
                    features,
                    timeEntries, 
                    userSettings, 
                    isUserOwnerOrAdmin, pullToRefresh, dates } = this.state;
            return (
                <div className="home_page">
                    {_withLogger &&
                        <Logger ref={this.loggerRef} />
                    }
                    <div className="header_and_timer">
                        <Header 
                                ref={instance => {this.header = instance}}
                                showActions={true}
                                showSync={true}
                                changeMode={this.changeMode}
                                disableManual={!!inProgress}
                                disableAutomatic={false}
                                handleRefresh={this.handleRefresh}
                                workspaceSettings={workspaceSettings}
                                isTrackerPage={true}
                                workspaceChanged={this.workspaceChanged}
                                isOffline={isOffline}
                        />
                        <Toaster
                            ref={instance => {this.toaster = instance}}
                        />
                        <StartTimer
                            ref={instance => {
                                this.start = instance;
                            }}
                            message={this.showMessage.bind(this)}
                            mode={mode}
                            changeMode={this.changeMode}
                            endStarted={this.handleRefresh}
                            setTimeEntryInProgress={this.inProgress.bind(this)}
                            workspaceSettings={workspaceSettings}
                            features={features}
                            timeEntries={timeEntries}
                            timeFormat={userSettings.timeFormat}
                            userSettings={userSettings}
                            toaster= {this.toaster}
                            log={this.log}
                        />
                    </div>
                    <div className={!isOffline && 
                                    timeEntriesOffline && 
                                    timeEntriesOffline.length > 0 ? "" : "disabled"}>
                        {!isOffline && 
                            <TimeEntryListNotSynced
                                timeEntries={timeEntriesOffline}
                                pullToRefresh={pullToRefresh}
                                handleRefresh={this.handleRefresh}
                                workspaceSettings={workspaceSettings}
                                features={features}
                                timeFormat={userSettings.timeFormat}
                                userSettings={userSettings}
                                isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                            />
                        }
                    </div>
                    <div className={(timeEntries.length===0 ? "time-entry-list__offline" : "time-entry-list")}>
                        <TimeEntryList
                            timeEntries={timeEntries}
                            dates={dates}
                            selectTimeEntry={this.continueTimeEntry.bind(this)}
                            pullToRefresh={pullToRefresh}
                            handleRefresh={this.handleRefresh}
                            changeMode={this.changeMode}
                            timeFormat={userSettings.timeFormat}
                            workspaceSettings={workspaceSettings}
                            features={features}
                            userSettings={userSettings}
                            isOffline={isOffline}
                            isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                        />
                    </div>
                </div>
            )
        }
    }
}

export default HomePage;
