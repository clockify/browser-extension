import * as React from 'react';
import moment, {duration} from 'moment';
import {parseTimeEntryDuration} from './duration-input-converter';
import EditForm from './edit-form.component';
import * as ReactDOM from 'react-dom';
import EditFormManual from './edit-form-manual.component';
import {isOffline} from "./check-connection";
import {getIconStatus} from "../enums/browser-icon-status-enum";
import {Application} from "../application";
import {TimeEntryHelper} from "../helpers/timeEntry-helper";
import {TimeEntryService} from "../services/timeEntry-service";
import {getKeyCodes} from "../enums/key-codes.enum";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {getBrowser} from "../helpers/browser-helper";
import {LocalStorageService} from "../services/localStorage-service";
import { ProjectService } from '../services/project-service';
import {DefaultProject} from '../helpers/storageUserWorkspace';
import {offlineStorage} from '../helpers/offlineStorage';

const timeEntryHelper = new TimeEntryHelper();
const timeEntryService = new TimeEntryService();
const localStorageService = new LocalStorageService();
const projectService = new ProjectService()
let interval;

class StartTimer extends React.Component {
    constructor(props) {
        super(props);

        // console.log('start-timer mode', localStorage.getItem('mode'))
        // console.log('start-timer localStorage.getItem(manualModeDisabled)', localStorage.getItem('manualModeDisabled'))
        // console.log('start-timer localStorage.getItem(modeEnforced)', localStorage.getItem('modeEnforced'))

        this.state = {
            timeEntry: {},
            time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
            interval: "",
            mode: this.props.mode,
            stopDisabled: false,
            isChecked: localStorage.getItem('offlineForTest') ? JSON.parse(localStorage.getItem('offlineForTest')) : false,
            isUserOwnerOrAdmin: offlineStorage.isUserOwnerOrAdmin
        };
        this.application = new Application(localStorageService.get('appType'));
        this.startNewEntry = this.startNewEntry.bind(this);
        this.handleChangeOffline = this.handleChangeOffline.bind(this);
    }

    handleChangeOffline() {
        const offlineForTest = localStorage.getItem('offlineForTest') ? JSON.parse(localStorage.getItem('offlineForTest')) : false;
        localStorage.setItem('offlineForTest', JSON.stringify(!offlineForTest));
        this.setState({ isChecked: offlineForTest })
    }

    get isChecked() {
        return localStorage.getItem('offlineForTest') ? JSON.parse(localStorage.getItem('offlineForTest')) : false;
    }

    async componentDidMount() {
        this.getTimeEntryInProgress();
    }  

    componentWillUnmount() {
        if (interval) {
            clearInterval(interval);
        }
    }

    getTimeEntryInProgress() {
        if (isOffline()) {
            this.setState({
                timeEntry: offlineStorage.timeEntryInOffline ? offlineStorage.timeEntryInOffline : {}
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
                    this.props.setTimeEntryInProgress(this.state.timeEntry);
                }
            })
        } else {
            timeEntryService.getEntryInProgress()
                .then(response => {
                    let timeEntry = response.data[0];
                    this.setTimeEntryInProgress(timeEntry);
                })
                .catch((error) => {
                    this.application.setIcon(getIconStatus().timeEntryEnded);
                })
        }
    }

    async setTimeEntryInProgress(timeEntry) {
        let inProgress = false;
        if (interval) {
            clearInterval(interval);
        }
        if (timeEntry) {
            this.setState({
                timeEntry
            }, () => {
                let currentPeriod = moment().diff(moment(timeEntry.timeInterval.start));
                interval = setInterval(() => {
                    currentPeriod = currentPeriod + 1000;
                    this.setState({
                        time: duration(currentPeriod).format('HH:mm:ss', {trim: false})
                    })
                }, 1000);
                this.props.changeMode('timer');
                this.props.setTimeEntryInProgress(timeEntry);
            });
            inProgress = true;
            this.application.setIcon(
                inProgress ? getIconStatus().timeEntryStarted : getIconStatus().timeEntryEnded
            );
            const { forceProjects, forceTasks } = this.props.workspaceSettings;
            const taskId = timeEntry.task ? timeEntry.task.id : timeEntry.taskId;

            // if (forceProjects && (!timeEntry.projectId || forceTasks && !taskId)) {
            if (!timeEntry.projectId || forceTasks && !taskId) {
                const {projectDB, taskDB} = await this.checkDefaultProjectTask(forceTasks);
                if (projectDB) {
                    const entry = await timeEntryHelper.updateProjectTask(timeEntry, projectDB, taskDB);
                    this.setState({
                        timeEntry: entry
                    })
                }
            }
        } 
        else {
            this.setState({
                timeEntry: {},
                time: moment().hour(0).minute(0).second(0).format('HH:mm:ss')
            });
            this.props.setTimeEntryInProgress(timeEntry);
            this.application.setIcon(
                inProgress ? getIconStatus().timeEntryStarted : getIconStatus().timeEntryEnded
            );
        }
    }

    async checkDefaultProjectTask(forceTasks) {
        const { storage, defaultProject } = DefaultProject.getStorage();
        if (defaultProject) {
            const { projectDB, taskDB, msg, msgId } = await defaultProject.getProjectTaskFromDB(forceTasks);
            if (msg) {
                this.props.toaster.toast('info', msg, 5);
            }
            return {projectDB, taskDB};
        }
        return {projectDB: null, taskDB: null};
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

    async startNewEntry() {
        if (interval) {
            clearInterval(interval);
        }
        if (isOffline()) {
            this.setState({
                timeEntry: {
                    workspaceId: localStorageService.get('activeWorkspaceId'),
                    id: offlineStorage.timeEntryIdTemp,
                    description: this.state.timeEntry.description,
                    projectId: this.state.timeEntry.projectId,
                    timeInterval: {
                        start: moment()
                    },
                    customFieldValues: offlineStorage.customFieldValues // generated from wsCustomFields
                }
            }, () => {
                offlineStorage.timeEntryInOffline = this.state.timeEntry;
                this.props.changeMode('timer');
                this.props.setTimeEntryInProgress(this.state.timeEntry);
                this.goToEdit();
            });
        } 
        else {
            const { timeEntry } = this.state;
            let projectId = timeEntry.projectId;
            let taskId = timeEntry.task ? timeEntry.task.id : null;
            let billable = timeEntry.billable

            const { forceProjects, forceTasks } = this.props.workspaceSettings;
            //if (forceProjects && (!projectId || forceTasks && !taskId)) {
            if (!projectId || forceTasks && !taskId) {
                const {projectDB, taskDB} = await this.checkDefaultProjectTask(forceTasks);
                if (projectDB) {
                    projectId = projectDB.id;
                    if (taskDB) {
                        taskId = taskDB.id;
                    }
                    billable = projectDB.billable;
                }
            }
            timeEntryService.startNewEntry(
                projectId,
                timeEntry.description,
                billable,
                moment(),
                taskId
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
                        backgroundPage.setTimeEntryInProgress(data);
                    }
                    this.goToEdit();
                });
            })
            .catch(() => {
            });
        }
    }

    checkRequiredFields() {
        if (this.state.stopDisabled)
            return;

        if (isOffline()) {
            let timeEntryOffline = offlineStorage.timeEntryInOffline;
            if (!timeEntryOffline) {
                // user tries to Stop TimeEntry which has been started onLine
                if (localStorage.getItem('inProgress') && JSON.parse(localStorage.getItem('inProgress'))) {
                    this.setTimeEntryInProgress(null);
                }
                return;
            }
        }

        this.setState({
            stopDisabled: true
        })

        const { forceDescription, forceProjects, forceTasks, forceTags} = this.props.workspaceSettings;
        const { description, project, task, tags } = this.state.timeEntry;

        if (isOffline()) {
            this.stopEntryInProgress();
        } else if(forceDescription && (description === "" || !description)) {
            this.goToEdit();
        } else if(forceProjects && !project) {
            this.goToEdit();
        } else if(forceTasks && !task) {
            this.goToEdit();
        }else if(forceTags && (!tags || !tags.length > 0)) {
            this.goToEdit();
        } else {
            this.stopEntryInProgress();
        }
    }

    stopEntryInProgress() {
        if (isOffline()) {
            let timeEntryOffline = offlineStorage.timeEntryInOffline;
            if (!timeEntryOffline) 
                return;
            timeEntryOffline.timeInterval.end = moment();
            timeEntryOffline.timeInterval.duration = duration(moment().diff(timeEntryOffline.timeInterval.start));
            const timeEntriesOffline = offlineStorage.timeEntriesOffline;
            timeEntriesOffline.push(timeEntryOffline);
            offlineStorage.timeEntriesOffline = timeEntriesOffline;
            offlineStorage.timeEntryInOffline = null;

            clearInterval(interval);
            interval = null
            this.setState({
                timeEntry: {},
                time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
                interval: "",
                stopDisabled: false
            });
            document.getElementById('description').value = '';
            this.props.setTimeEntryInProgress(null);
            this.props.endStarted();
        } else {
            timeEntryService.stopEntryInProgress(moment())
                .then(() => {
                    clearInterval(interval);
                    interval = null
                    this.setState({
                        timeEntry: {},
                        time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
                        stopDisabled: false
                    });
                    document.getElementById('description').value = '';
                    this.props.setTimeEntryInProgress(null);
                    this.props.endStarted();
                    if (isAppTypeExtension()) {
                        const backgroundPage = getBrowser().extension.getBackgroundPage();
                        backgroundPage.removeIdleListenerIfIdleIsEnabled();
                        backgroundPage.addReminderTimer();
                        backgroundPage.removeAllPomodoroTimers();
                        backgroundPage.setTimeEntryInProgress(null);
                    }
                    this.application.setIcon(getIconStatus().timeEntryEnded);
                })
                .catch(() => {
                    this.props.log('timeEntryService.stopEntryInProgress error')
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
                      userSettings={this.props.userSettings}
            />, document.getElementById('mount')
        );
    }

    goToEditManual() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        if (!this.state.timeEntry.timeInterval) {
            this.setState({
                timeEntry: {
                    workspaceId: activeWorkspaceId,
                    timeInterval: {
                        start: moment(), 
                        end: moment()
                    }
                }
            }, () => {
                ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
                ReactDOM.render(
                    <EditFormManual 
                        changeMode={this.changeMode.bind(this)}
                        workspaceSettings={this.props.workspaceSettings}
                        timeEntry={this.state.timeEntry}
                        timeFormat={this.props.timeFormat}
                        userSettings={this.props.userSettings}
                    />, document.getElementById('mount')
                );
            })
        } 
        else {
            const { timeEntry } = this.state;
            if (!timeEntry.workspaceId)
                timeEntry.workspaceId = activeWorkspaceId;
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <EditFormManual
                    changeMode={this.changeMode.bind(this)}
                    workspaceSettings={this.props.workspaceSettings}
                    timeEntry={timeEntry}
                    timeFormat={this.props.timeFormat}
                    userSettings={this.props.userSettings}
                />, document.getElementById('mount'));
        }
    }

    onKey(event) {
        const { enter, minus } = getKeyCodes();
        if (enter.includes(event.keyCode)) {
            if (event.target.id === 'description') {
                this.startNewEntry();
            }
            else if (event.target.id === 'duration') {
                this.goToEditManual();
            }
        }
    }

    render() {
        // console.log('this.state.timeEntry', this.state.timeEntry)
        const { id, description, task, project } = this.state.timeEntry;
        return (
           <div id="start-timer">
               <div className="start-timer">
                    {/* <span>Offline <input type='checkbox' checked={this.isChecked} onChange={this.handleChangeOffline} />  </span> */}
                    <span className={this.props.mode === 'timer' ? 'start-timer-description' : 'disabled'}>
                        <div onClick={this.goToEdit.bind(this)}
                              className={id ? "start-timer_description" : "disabled"}>
                            <span>
                                {description || "(no description)"}
                            </span>
                            <div style={project ? {color: project.color} : {}}
                                 className={project ?
                                    "time-entry-project" : "disabled"}>
                                <div className="time-entry__project-wrapper">
                                    <div style={project ? {background: project.color} : {}} className="dot"></div>
                                    <span className="time-entry__project-name" >{project ? project.name : ""}</span>
                                </div>
                                <span className="time-entry__task-name">
                                    {task ? " - " + task.name : ""}
                                </span>
                            </div>
                        </div>
                        <input className={!id ? "start-timer_description-input" : "disabled"}
                               placeholder={"What are you working on?"}
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
                   <button className={!id && this.props.mode === 'timer' ?
                                        "start-timer_button-start" : "disabled"}
                           onClick={this.startNewEntry}>
                        <span>START</span>
                   </button>
                   <button className={id && this.props.mode === 'timer' ?
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
