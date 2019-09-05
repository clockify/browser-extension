import * as React from 'react';
import moment, {duration} from 'moment';
import {parseTimeEntryDuration} from './duration-input-converter';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import EditFormManual from './edit-form-manual.component';
import {checkConnection} from "./check-connection";
import {getIconStatus} from "../enums/browser-icon-status-enum";
import {Application} from "../application";
import {ProjectHelper} from "../helpers/project-helper";
import {TimeEntryService} from "../services/timeEntry-service";
import {getKeyCodes} from "../enums/key-codes.enum";
import {isAppTypeExtension, isAppTypeMobile} from "../helpers/app-types-helper";
import {getBrowser} from "../helpers/browser-helper";
import {LocalStorageService} from "../services/localStorage-service";

const projectHelpers = new ProjectHelper();
const timeEntryService = new TimeEntryService();
const localStorageService = new LocalStorageService();
let interval;

class StartTimer extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            timeEntry: {},
            time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
            interval: "",
            mode: this.props.mode,
            ready: false
        };

        this.application = new Application(localStorageService.get('appType'));
    }

    componentDidMount() {
        this.getTimeEntryInProgress();

        if (isAppTypeMobile()) {
            this.getEntryInProgressOnResume();
        }
    }

    getEntryInProgressOnResume() {
        document.addEventListener("resume", () => {
            clearInterval(interval);
            this.getTimeEntryInProgress();
        });
    }

    getTimeEntryInProgress() {
        if(checkConnection()) {
            this.setState({
                timeEntry: localStorage.getItem('timeEntryInOffline') && JSON.parse(localStorage.getItem('timeEntryInOffline')) ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : {}
            }, () => {
                if(this.state.timeEntry.timeInterval) {
                    let currentPeriod = moment().diff(moment(this.state.timeEntry.timeInterval.start));
                    interval = setInterval(() => {
                        currentPeriod = currentPeriod + 1000;
                        this.setState({
                            time: duration(currentPeriod).format('HH:mm:ss', {trim: false})
                        })
                    }, 1000);

                    this.props.changeMode('timer');
                    this.setState({
                        interval: interval
                    });
                    this.props.setTimeEntryInProgress(this.state.timeEntry);
                }
            })
        } else {
            timeEntryService.getEntryInProgress().then(response => {
                let timeEntry = response.data[0];

                this.setTimeEntryInProgress(timeEntry);
                })
                .catch(() => {
                    this.application.setIcon(getIconStatus().timeEntryEnded);
                })
        }
    }

    setTimeEntryInProgress(timeEntry) {
        let inProgress = false;

        if (this.state.interval) {
            clearInterval(this.state.interval);
        }

        if(timeEntry) {
            projectHelpers.getDefaultProject().then(defaultProject => {
                if (defaultProject) {
                    if (timeEntry.projectId === null || timeEntry.projectId === "") {
                        timeEntryService.updateProject(defaultProject.id, timeEntry.id);
                        timeEntryService.updateBillable(defaultProject.billable, timeEntry.id);
                    }
                } else {
                    const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
                    const userId = localStorageService.get('userId');
                    projectHelpers.removeDefaultProjectForWorkspaceAndUser(activeWorkspaceId, userId);

                    this.setState({
                        ready: true
                    });
                }

                this.setState({
                    timeEntry: timeEntry
                }, () => {
                    let currentPeriod = moment().diff(moment(this.state.timeEntry.timeInterval.start));
                    let interval = setInterval(() => {
                        currentPeriod = currentPeriod + 1000;
                        this.setState({
                            time: duration(currentPeriod).format('HH:mm:ss', {trim: false})
                        })
                    }, 1000);

                    this.props.changeMode('timer');
                    this.setState({
                        interval: interval
                    });

                    this.props.setTimeEntryInProgress(timeEntry);
                });
                inProgress = true;
                this.application.setIcon(
                    inProgress ? getIconStatus().timeEntryStarted : getIconStatus().timeEntryEnded
                );
            });
        } else {
            this.setState({
                timeEntry: {},
                interval: "",
                time: moment().hour(0).minute(0).second(0).format('HH:mm:ss')
            });
            this.props.setTimeEntryInProgress(timeEntry);
            this.application.setIcon(
                inProgress ? getIconStatus().timeEntryStarted : getIconStatus().timeEntryEnded
            );
        }
    }

    setDescription(event) {

        let timeEntry = {
            description: event.target.value
        };

        this.setState({
            timeEntry: timeEntry
        })
    }

    setDuration(event) {
        let duration = parseTimeEntryDuration(event.target.value);

        if (!duration) {
            return;
        }

        let start = moment().add(-parseInt(duration.split(':')[0]), 'hours')
                            .add(-parseInt(duration.split(':')[1]), 'minutes')
                            .add(-parseInt(duration.split(':')[2]), 'seconds');
        let timeEntry = {
            timeInterval: {
                start: start,
                end: moment()
            }
        };

        this.setState({
            timeEntry: timeEntry
        });
    }

    startNewEntry() {
        if (interval) {
            clearInterval(interval);
        }
        if(checkConnection()) {
            this.setState({
                timeEntry: {
                    id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                    description: this.state.timeEntry.description,
                    projectId: this.state.timeEntry.projectId,
                    timeInterval: {
                        start: moment()
                    }
                }
            }, () => {
                localStorage.setItem('timeEntryInOffline', JSON.stringify(this.state.timeEntry));
                this.props.changeMode('timer');
                this.props.setTimeEntryInProgress(this.state.timeEntry);
                this.goToEdit();
            });
        } else {
            timeEntryService.startNewEntry(
                this.state.timeEntry.projectId,
                this.state.timeEntry.description,
                this.state.timeEntry.billable,
                moment()
            ).then(response => {
                let data = response.data;

                this.setState({
                    timeEntry: data
                }, () => {
                    this.props.changeMode('timer');
                    this.props.setTimeEntryInProgress(data);
                    this.application.setIcon(getIconStatus().timeEntryStarted);
                    if (isAppTypeExtension()) {
                        const backgroundPage = getBrowser().extension.getBackgroundPage();
                        backgroundPage.addIdleListenerIfIdleIsEnabled();
                        backgroundPage.removeReminderTimer();
                        backgroundPage.addPomodoroTimer();
                        backgroundPage.entryInProgressChangedEventHandler(data);
                    }
                    this.goToEdit();
                });
            })
            .catch(() => {
            });
        }
    }

    checkRequiredFields() {
        if(JSON.parse(localStorage.getItem('offline'))) {
            this.stopEntryInProgress();
        } else if(this.props.workspaceSettings.forceDescription && (this.state.timeEntry.description === "" || !this.state.timeEntry.description)) {
            this.goToEdit();
        } else if(this.props.workspaceSettings.forceProjects && !this.state.timeEntry.project) {
            this.goToEdit();
        } else if(this.props.workspaceSettings.forceTasks && !this.state.timeEntry.task) {
            this.goToEdit();
        }else if(this.props.workspaceSettings.forceTags && (!this.state.timeEntry.tags || !this.state.timeEntry.tags.length > 0)) {
            this.goToEdit();
        } else {
            this.stopEntryInProgress();
        }
    }

    stopEntryInProgress() {
        if(checkConnection()) {
            const timeEntriesOffline = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
            let timeEntryOffline = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            timeEntryOffline.timeInterval.end = moment();
            timeEntryOffline.timeInterval.duration = duration(moment().diff(timeEntryOffline.timeInterval.start));
            timeEntriesOffline.push(timeEntryOffline);

            localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntriesOffline));
            localStorage.setItem('timeEntryInOffline', null);

            clearInterval(this.state.interval);
            clearInterval(interval);
            this.setState({
                timeEntry: {},
                time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
                interval: ""
            });
            document.getElementById('description').value = '';
            this.props.setTimeEntryInProgress(null);
            this.props.endStarted();
        } else {
            timeEntryService.stopEntryInProgress(moment())
                .then(() => {
                    clearInterval(this.state.interval);
                    clearInterval(interval);
                    this.setState({
                        timeEntry: {},
                        time: moment().hour(0).minute(0).second(0).format('HH:mm:ss')
                    });
                    document.getElementById('description').value = '';
                    this.props.setTimeEntryInProgress(null);
                    this.props.endStarted();
                    if (isAppTypeExtension()) {
                        const backgroundPage = getBrowser().extension.getBackgroundPage();
                        backgroundPage.removeIdleListenerIfIdleIsEnabled();
                        backgroundPage.addReminderTimer();
                        backgroundPage.removeAllPomodoroTimers();
                        backgroundPage.entryInProgressChangedEventHandler(null);
                    }
                    this.application.setIcon(getIconStatus().timeEntryEnded);
                })
                .catch(() => {
                });
        }
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    goToEdit() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(
            <EditForm changeMode={this.changeMode.bind(this)}
                      timeEntry={this.state.timeEntry}
                      workspaceSettings={this.props.workspaceSettings}
                      timeFormat={this.props.timeFormat}
                      isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                      userSettings={this.props.userSettings}
            />, document.getElementById('mount')
        );
    }

    goToEditManual() {
        if(!this.state.timeEntry.timeInterval) {
            this.setState({
                timeEntry: {timeInterval: {start: moment(), end: moment()}}
            }, () => {
                const entry = {timeInterval: {start: moment(), end: moment()}};
                ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
                ReactDOM.render(
                    <EditFormManual changeMode={this.changeMode.bind(this)}
                                    workspaceSettings={this.props.workspaceSettings}
                                    timeEntry={entry}
                                    timeFormat={this.props.timeFormat}
                                    isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                    userSettings={this.props.userSettings}
                    />, document.getElementById('mount')
                );
            })
        } else {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <EditFormManual changeMode={this.changeMode.bind(this)}
                                workspaceSettings={this.props.workspaceSettings}
                                timeEntry={this.state.timeEntry}
                                timeFormat={this.props.timeFormat}
                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                userSettings={this.props.userSettings}
                />, document.getElementById('mount'));
        }
    }

    onKey(event) {
        switch (event.keyCode) {
            case getKeyCodes().enter:
                if (event.target.id === 'description') {
                    this.startNewEntry();
                    break;
                }

                if (event.target.id === 'duration') {
                    this.goToEditManual();
                    break;
                }
        }
    }


    render() {
        return (
           <div id="start-timer">
               <div className="start-timer">
                    <span className={this.props.mode === 'timer' ? 'start-timer-description' : 'disabled'}>
                        <div onClick={this.goToEdit.bind(this)}
                              className={this.state.timeEntry.id ?
                                  "start-timer_description" : "disabled"}>
                            <span>
                                {this.state.timeEntry.description || "(no description)"}
                            </span>
                            <div style={this.state.timeEntry.project ? {color: this.state.timeEntry.project.color} : {}}
                                 className={this.state.timeEntry.project ?
                                    "time-entry-project" : "disabled"}>
                                <div className="time-entry__project-wrapper">
                                    <div style={this.state.timeEntry.project ? {background: this.state.timeEntry.project.color} : {}} className="dot"></div>
                                    <span className="time-entry__project-name" >{this.state.timeEntry.project ? this.state.timeEntry.project.name : ""}</span>
                                </div>
                                <span className="time-entry__task-name">
                                    {this.state.timeEntry.task ? " - " + this.state.timeEntry.task.name : ""}
                                </span>
                            </div>
                        </div>
                        <input className={!this.state.timeEntry.id ? "start-timer_description-input" : "disabled"}
                               placeholder={"What's up?"}
                               onChange={this.setDescription.bind(this)}
                               id="description"
                               onKeyDown={this.onKey.bind(this)}
                        />
                    </span>
                   <span className={this.props.mode === 'manual' ? 'start-timer-description' : 'disabled'}>
                        <input className={"start-timer_description-input" }
                               id="duration"
                               placeholder={"Enter time (eg. 1.5)"}
                               onChange={this.setDuration.bind(this)}
                               onKeyDown={this.onKey.bind(this)}/>
                   </span>
                   <button className={!this.state.timeEntry.id && this.props.mode === 'timer' ?
                                        "start-timer_button-start" : "disabled"}
                           onClick={this.startNewEntry.bind(this)}>
                        <span>START</span>
                   </button>
                   <button className={this.state.timeEntry.id && this.props.mode === 'timer' ?
                                        "start-timer_button-red" : "disabled"}
                           onClick={this.checkRequiredFields.bind(this)}>
                       <span className="button_timer">
                           {this.state.time}
                       </span>
                       <span className="button_stop">
                           STOP
                       </span>
                   </button>
                   <button className={this.props.mode === 'manual' ? "start-timer_button-start" : "disabled"} onClick={this.goToEditManual.bind(this)}>
                       <span>ADD TIME</span>
                   </button>
               </div>
           </div>
        )
    }
}

export default StartTimer;
