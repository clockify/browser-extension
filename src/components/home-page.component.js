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
import {checkConnection} from "./check-connection";
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
import {WebSocketClient} from "../web-socket/web-socket-client";
import {LocalStorageService} from "../services/localStorage-service";
import {getWorkspacePermissionsEnums} from "../enums/workspace-permissions.enum";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {HtmlStyleHelper} from "../helpers/html-style-helper";

const projectService = new ProjectService();
const webSocketClient = new WebSocketClient();
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
let websocketHandlerListener;

class HomePage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            ready: false,
            selectedTimeEntry: {},
            timeEntries: [],
            mode: localStorage.getItem('mode') ? localStorage.getItem('mode') : 'timer',
            dates: {},
            loadMore: true,
            pageCount: 0,
            inProgress: null,
            loading: false,
            workspaceSettings: {},
            pullToRefresh: false,
            projects: [],
            tasks: [],
            userSettings: JSON.parse(localStorage.getItem('userSettings')),
            durationMap: {},
            isUserOwnerOrAdmin: false,
        };

        this.application = new Application(localStorageService.get('appType'));

        this.handleScroll = this.handleScroll.bind(this);
        this.loadMoreEntries = this.loadMoreEntries.bind(this);
    }

    componentDidMount() {
        localStorage.setItem('appVersion', packageJson.version);
        document.addEventListener('backbutton', this.handleBackButton, false);
        document.addEventListener('scroll', this.handleScroll, false);
        htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();
        this.getWorkspaceSettings();
        this.saveAllOfflineEntries();
        this.webSocketMessagesHandler();

        if (isAppTypeExtension()) {
            this.enableAllIntegrationsButtonIfNoneIsEnabled();
            this.enableTimerShortcutForFirstTime();
            getBrowser().runtime.sendMessage({
                eventName: "webSocketConnect",
            });
            this.getEntryFromPomodoroEvents();
        } else {
            webSocketClient.connect();
        }

        this.setIsUserOwnerOrAdmin();
    }

    getEntryFromPomodoroEvents() {
        getBrowser().runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.eventName === 'pomodoroEvent') {
                this.start.setTimeEntryInProgress(request.timeEntry);
            }
        });
    }

    setIsUserOwnerOrAdmin() {
        workspaceService.getPermissionsForUser().then(workspacePermissions => {
            const isUserOwnerOrAdmin = workspacePermissions.filter(permission =>
                permission.name === getWorkspacePermissionsEnums().WORKSPACE_OWN ||
                permission.name === getWorkspacePermissionsEnums().WORKSPACE_ADMIN
            ).length > 0;
            this.setState({
                isUserOwnerOrAdmin: isUserOwnerOrAdmin
            }, () => {
                localStorageService.set('isUserOwnerOrAdmin', isUserOwnerOrAdmin);
                this.handleRefresh();
            });
        });
    }

    enableTimerShortcutForFirstTime() {
        const userId = localStorageService.get('userId');
        let timerShortcutFromStorage =
            localStorageService.get('timerShortcut') ? JSON.parse(localStorageService.get('timerShortcut')) : [];

        if (
            timerShortcutFromStorage.length === 0 ||
            (timerShortcutFromStorage.length > 0 &&
                timerShortcutFromStorage.filter(timerShortcut => timerShortcut.userId === userId).length === 0)
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
                            this.getWorkspaceSettings();
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

    saveAllOfflineEntries() {
        if (!JSON.parse(localStorage.getItem('offline'))) {
            let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
            timeEntries.map(entry => {
                timeEntryService.createEntry(
                    entry.description,
                    entry.timeInterval.start,
                    entry.timeInterval.end,
                    null,
                    null,
                    [],
                    entry.billable
                ).then(response => {
                    let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                    if (timeEntries.findIndex(entryOffline => entryOffline.id === entry.id) > -1) {
                        timeEntries.splice(timeEntries.findIndex(entryOffline => entryOffline.id === entry.id), 1);
                    }
                    localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
                })
                    .catch(error => {
                    });
            });
            localStorage.setItem('timeEntryInOffline', null);
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
        if (!JSON.parse(localStorage.getItem('offline'))) {
            workspaceService.getWorkspaceSettings()
                .then(response => {
                    this.setState({
                        workspaceSettings: response.data.workspaceSettings
                    }, () => {
                        localStorageService.set(
                            "workspaceSettings",
                            JSON.stringify(response.data.workspaceSettings)
                        );
                        this.getTimeEntries();
                    });
                })
                .catch((error) => {
                });
        } else {
            this.getTimeEntries();
        }
    }

    getTimeEntries(reload) {
        if (!JSON.parse(localStorage.getItem('offline'))) {
            timeEntryService.getTimeEntries(reload ? 0 : this.state.pageCount)
                .then(response => {
                    const timeEntries =
                        response.data.timeEntriesList.filter(entry => entry.timeInterval.end);
                    const durationMap = response.data.durationMap;
                    this.setState({
                        timeEntries: []
                    }, () => {
                        this.setState({
                            timeEntries: this.groupEntries(timeEntries, durationMap),
                            durationMap: durationMap,
                            ready: true
                        });
                    });
                    this.getAllProjects();
                })
                .catch((error) => {
                });
        } else {
            this.setState({
                timeEntries: localStorage.getItem('timeEntriesOffline') ?
                    this.groupEntries(JSON.parse(localStorage.getItem('timeEntriesOffline'))) : [],
                ready: true
            })
        }
        if (reload || this.state.pageCount === 0) {
            htmlStyleHelper.scrollToTop();
            ReactDOM.render(<HomePage/>, document.getElementById('mount'));
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
        if (event.srcElement.body.scrollTop < 20) {
            this.setState({
                pullToRefresh: false
            });
        } else {
            this.setState({
                pullToRefresh: true
            })
        }

        if (event.srcElement.body.scrollTop + window.innerHeight >
            event.srcElement.body.scrollHeight - 100 &&
            this.state.loadMore && !this.state.loading &&
            !checkConnection()) {

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
                    this.getAllProjects();
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
            localStorage.setItem('mode', mode);
        })
    }

    inProgress(inProgress) {
        this.setState({
            inProgress: inProgress
        }, () => {
            localStorage.setItem('inProgress', !!inProgress);
        })
    }

    endStartedAndStart(timeEntry) {
        if (checkConnection()) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
            if (timeEntry) {
                timeEntry.timeInterval.end = moment();
                timeEntries.push(timeEntry);
                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));

                let timeEntryNew = {
                    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                    description: timeEntry.description,
                    timeInterval: {start: moment()},
                    projectId: timeEntry.projectId,
                    taskId: timeEntry.taskId,
                    tagIds: timeEntry.tagIds,
                    billable: timeEntry.billable
                };

                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntryNew));
                this.start.setTimeEntryInProgress(timeEntryNew);
            }
        } else {
            timeEntryService.stopEntryInProgress(moment())
                .then(() => {
                    if (isAppTypeExtension()) {
                        getBrowser().extension.getBackgroundPage().removeIdleListenerIfIdleIsEnabled();
                        getBrowser().extension.getBackgroundPage().entryInProgressChangedEventHandler(null);
                    }
                    timeEntryService.createEntry(
                        timeEntry.description,
                        moment(),
                        null,
                        timeEntry.projectId,
                        timeEntry.taskId,
                        timeEntry.tagIds,
                        timeEntry.billable
                    ).then(response => {
                        let data = response.data;
                        if (isAppTypeExtension()) {
                            getBrowser().extension.getBackgroundPage().addIdleListenerIfIdleIsEnabled();
                            getBrowser().extension.getBackgroundPage().entryInProgressChangedEventHandler(data);
                        }
                        this.handleRefresh();
                    }).catch(() => {});
                })
                .catch(() => {
                });
        }
    }

    checkRequiredFields(timeEntry) {
        if (checkConnection()) {
            this.endStartedAndStart(timeEntry);
        } else if (this.state.workspaceSettings.forceDescription &&
            (this.state.inProgress.description === "" || !this.state.inProgress.description)) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"description"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else if (this.state.workspaceSettings.forceProjects && !this.state.inProgress.projectId) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"project"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else if (this.state.workspaceSettings.forceTasks && !this.state.inProgress.taskId) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"task"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else if (this.state.workspaceSettings.forceTags &&
            (!this.state.timeEntry.tagIds || !this.state.timeEntry.tagIds.length > 0)) {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <RequiredFields field={"tags"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else {
            this.endStartedAndStart(timeEntry);
        }
    }

    goToEdit() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(
            <EditForm changeMode={this.changeMode.bind(this)}
                      timeEntry={this.state.inProgress}
                      workspaceSettings={this.state.workspaceSettings}
                      timeFormat={this.state.userSettings.timeFormat}
                      userSettings={this.state.userSettings}
                      isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
            />, document.getElementById('mount')
        );
    }

    continueTimeEntry(timeEntry) {
        if (this.state.inProgress) {
            this.checkRequiredFields(timeEntry);
        } else {
            if (checkConnection()) {
                let timeEntryOffline = {
                    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                    description: timeEntry.description,
                    timeInterval: {
                        start: moment()
                    },
                    billable: timeEntry.billable,
                    loadMore: false
                };

                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntryOffline));
                this.start.setTimeEntryInProgress(timeEntryOffline);
            } else {
                timeEntryService.createEntry(
                    timeEntry.description,
                    moment(),
                    null,
                    timeEntry.projectId,
                    timeEntry.taskId,
                    timeEntry.tagIds,
                    timeEntry.billable
                ).then(response => {
                    let data = response.data;
                    if (isAppTypeExtension()) {
                        getBrowser().extension.getBackgroundPage().addIdleListenerIfIdleIsEnabled();
                        getBrowser().extension.getBackgroundPage().addPomodoroTimer();
                        getBrowser().extension.getBackgroundPage().entryInProgressChangedEventHandler(data);
                    }
                    this.handleRefresh();
                    this.application.setIcon(getIconStatus().timeEntryStarted);
                }).catch(() => {});
            }
        }
    }

    getAllProjects() {
        if (this.state.timeEntries.length === 0) {
            return;
        }
        projectService.getAllProjects()
            .then(response => {
                let projects = response.data;
                const projectIds = projects.map(project => project.id);
                const missingProjectIds = this.state.timeEntries
                    .filter(entry => entry.projectId && !projectIds.includes(entry.projectId))
                    .map(entry => entry.projectId);

                this.getMissingProject(missingProjectIds).then(response => {
                    if (response.length > 0) {
                        projects = [...projects, ...response];
                    }

                    this.setState({
                        projects: projects
                    }, () => {
                        this.getAllTasks();
                    })
                });
            })
            .catch((error) => {
            });
    }

    getMissingProject(projectIds) {
        if (!projectIds || projectIds.length === 0) {
            return Promise.resolve([]);
        } else {
            return projectService.getProjectsByIds(projectIds).then(response => response.data);
        }
    }

    getAllTasks() {
        let taskIds =
            this.state.timeEntries
                .filter(timeEntry => timeEntry.taskId)
                .map(timeEntry => timeEntry.taskId);
        let uniqueIds = taskIds.filter(function (id, pos) {
            return taskIds.indexOf(id) === pos;
        });

        projectService.getAllTasks(uniqueIds)
            .then(response => {
                let data = response.data;
                this.setState({
                    tasks: data
                })
            })
            .catch((error) => {
            });
    }

    handleRefresh() {
        if (!checkConnection()) {
            this.saveAllOfflineEntries();
            this.setState({
                pageCount: 0
            }, () => {
                this.getWorkspaceSettings();
            });
            if (this.start) {
                this.start.getTimeEntryInProgress();
            }
        } else {
            this.getTimeEntries();
        }
    }

    enableAllIntegrationsButtonIfNoneIsEnabled() {
        fetch("integrations/integrations.json")
            .then(response => response.json())
            .then(data => {
                getBrowser().storage.local.get('permissions', (result) => {
                    const userId = localStorage.getItem('userId');
                    if (
                        result.permissions && result.permissions.length > 0
                    ) {
                        if (
                            result.permissions
                                .filter(permission => permission.userId === userId).length > 0
                        ) {
                            return;
                        }
                        this.setClockifyOriginsToStorage(data, userId, result.permissions);
                    } else {
                        this.setClockifyOriginsToStorage(data, userId);
                    }
                });
            });
    }

    setClockifyOriginsToStorage(clockifyOrigins, userId, permissionsFromStorage) {
        const permissionsForStorage = permissionsFromStorage ? permissionsFromStorage : [];
        const permissions = [];
        const permissionsByUser = {};

        for (let key in clockifyOrigins) {
            let permission = {};
            permission['domain'] = key;
            permission['isEnabled'] = true;
            permission['script'] = clockifyOrigins[key].script;
            permission['name'] = clockifyOrigins[key].name;
            permission['isCustom'] = false;
            permissions.push(permission);
        }
        permissionsByUser['permissions'] = permissions;
        permissionsByUser['userId'] = userId;
        permissionsForStorage.push(permissionsByUser);

        getBrowser().storage.local.set({permissions: permissionsForStorage});
    }

    componentWillUnmount() {
        getBrowser().runtime.onMessage.removeListener(websocketHandlerListener);
    }

    render() {
        if (!this.state.ready) {
            return null;
        } else {
            return (
                <div className="home_page">
                    <div className="header_and_timer">
                        <Header showActions={true}
                                showSync={true}
                                changeMode={this.changeMode.bind(this)}
                                mode={this.state.mode}
                                disableManual={!!this.state.inProgress}
                                disableAutomatic={false}
                                handleRefresh={this.handleRefresh.bind(this)}
                                workspaceSettings={this.state.workspaceSettings}
                                workspaceChanged={this.handleRefresh.bind(this)}
                        />
                        <StartTimer
                            ref={instance => {
                                this.start = instance;
                            }}
                            mode={this.state.mode}
                            changeMode={this.changeMode.bind(this)}
                            endStarted={this.handleRefresh.bind(this)}
                            setTimeEntryInProgress={this.inProgress.bind(this)}
                            workspaceSettings={this.state.workspaceSettings}
                            timeEntries={this.state.timeEntries}
                            timeFormat={this.state.userSettings.timeFormat}
                            isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                            userSettings={this.state.userSettings}
                        />
                    </div>
                    <div
                        className={this.state.timeEntries.length > 0 ? "pull-loading" : "disabled"}>
                        <img src="./assets/images/circle_1.svg" className="pull-loading-img1"/>
                        <img src="./assets/images/circle_2.svg" className="pull-loading-img2"/>
                    </div>
                    <div className={this.state.ready &&
                    !JSON.parse(localStorage.getItem('offline')) &&
                    JSON.parse(localStorage.getItem('timeEntriesOffline')) &&
                    JSON.parse(localStorage.getItem('timeEntriesOffline')).length > 0 ?
                        "" : "disabled"}>
                        <TimeEntryListNotSynced
                            timeEntries={JSON.parse(localStorage.getItem('timeEntriesOffline'))}
                            pullToRefresh={this.state.pullToRefresh}
                            handleRefresh={this.handleRefresh.bind(this)}
                            workspaceSettings={this.state.workspaceSettings}
                            timeFormat={this.state.userSettings.timeFormat}
                            isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                            userSettings={this.state.userSettings}
                        />
                    </div>
                    <div className={this.state.ready ? (this.state.timeEntries.length === 0 ?
                        "time-entry-list__offline" : "time-entry-list") :
                        "disabled"}>
                        <TimeEntryList
                            timeEntries={this.state.timeEntries}
                            dates={this.state.dates}
                            projects={this.state.projects}
                            tasks={this.state.tasks}
                            selectTimeEntry={this.continueTimeEntry.bind(this)}
                            pullToRefresh={this.state.pullToRefresh}
                            handleRefresh={this.handleRefresh.bind(this)}
                            changeMode={this.changeMode.bind(this)}
                            timeFormat={this.state.userSettings.timeFormat}
                            workspaceSettings={this.state.workspaceSettings}
                            isUserOwnerOrAdmin={this.state.isUserOwnerOrAdmin}
                            userSettings={this.state.userSettings}
                        />
                    </div>
                    <div className={this.state.loading ? "pull-loading-entries" : "disabled"}>
                        <img src="./assets/images/circle_1.svg" className="pull-loading-img1"/>
                        <img src="./assets/images/circle_2.svg" className="pull-loading-img2"/>
                    </div>
                </div>
            )
        }
    }
}

export default HomePage;
