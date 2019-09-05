import * as React from 'react';
import Header from './header.component';
import Duration from './duration.component';
import moment from 'moment';
import {duration} from 'moment/moment';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import * as ReactDOM from 'react-dom';
import HomePage from './home-page.component';
import {checkConnection} from "./check-connection";
import {ProjectHelper} from "../helpers/project-helper";
import {TimeEntryService} from "../services/timeEntry-service";
import DeleteEntryConfirmationComponent from "./delete-entry-confirmation.component";
import {LocalStorageService} from "../services/localStorage-service";
import Toaster from "./toaster-component";

const projectHelpers = new ProjectHelper();
const timeEntryService = new TimeEntryService();
const localStorageService = new LocalStorageService();

class EditFormManual extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timeEntry: this.props.timeEntry,
            time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
            interval: '',
            ready: false,
            descRequired: false,
            projectRequired: false,
            taskRequired: false,
            tagsRequired: false,
            askToDeleteEntry: false
        }
    }

    componentDidMount(){
        let timeEntry = this.state.timeEntry;
        projectHelpers.getDefaultProject().then(defaultProject => {
            if (defaultProject) {
                projectHelpers.setDefaultProjectToEntryIfNotSet(this.state.timeEntry)
                    .then(timeEntry => {
                        let entry = timeEntry;
                        entry.billable = defaultProject.billable;
                        this.setState({
                            timeEntry: entry
                        },() => {
                            this.checkRequiredFields();
                        });
                    });
            } else {
                const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
                const userId = localStorageService.get('userId');
                projectHelpers.removeDefaultProjectForWorkspaceAndUser(activeWorkspaceId, userId);
                this.checkRequiredFields();
            }
        });

        timeEntry.timeInterval.duration =
            moment.duration(
                moment(timeEntry.timeInterval.end).diff(moment(timeEntry.timeInterval.start))
            );

        this.setState({
            timeEntry: timeEntry
        });
        this.setTime();
    }

    setTime() {
        clearInterval(this.state.interval);
        if(!this.state.timeEntry.timeInterval.end) {
            let currentPeriod = moment().diff(moment(this.state.timeEntry.timeInterval.start));
            let interval = setInterval(() => {
                currentPeriod = currentPeriod + 1000;
                this.setState({
                    time: duration(currentPeriod).format('HH:mm:ss', {trim: false})
                })
            }, 1000);

            this.setState({
                interval: interval
            })
        } else {
            let currentPeriod = moment(this.state.timeEntry.timeInterval.end).diff(this.state.timeEntry.timeInterval.start);

            this.setState({
                time: duration(currentPeriod).format('HH:mm:ss', {trim: false})
            })
        }
    }

    changeInterval(timeInterval) {
        let timeEntry = this.state.timeEntry;
        timeEntry.timeInterval = timeInterval;

        this.setState({
            timeEntry: timeEntry
        }, () => {
            this.setTime();
        });

    }

    changeDuration(newDuration){
        if (!newDuration || !this.state.timeEntry.timeInterval.end) {
            return;
        }

        let timeEntry = this.state.timeEntry;

        let end = moment(this.state.timeEntry.timeInterval.start)
            .add(parseInt(newDuration.split(':')[0]), 'hours')
            .add(parseInt(newDuration.split(':')[1]), 'minutes')
            .add(parseInt(newDuration.split(':')[2]), 'seconds');

        timeEntry.timeInterval.end = end;
        timeEntry.timeInterval.duration =
            duration(moment(this.state.timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start));

        this.setState({
            timeEntry: timeEntry
        }, () => {
            this.setTime();
            this.duration.setState({
                startTime:  timeEntry.timeInterval.start,
                endTime: timeEntry.timeInterval.end
            });
        });
    }

    setDescription(event) {
        let timeEntry = this.state.timeEntry;
        timeEntry.description =  event.target.value;

        this.setState({
            timeEntry: timeEntry
        }, () => this.checkRequiredFields());
    }

    editProject(project) {
        let timeEntry = this.state.timeEntry;
        timeEntry.projectId =  project.id;

        this.setState({
            timeEntry: timeEntry
        }, () => this.checkRequiredFields());
    }

    editTask(taskId, project) {
        let timeEntry = this.state.timeEntry;
        timeEntry.projectId =  project.id;
        timeEntry.taskId =  taskId;

        this.setState({
            timeEntry: timeEntry
        }, () => this.checkRequiredFields());
    }

    editTags(tagId) {
        let timeEntry = this.state.timeEntry;

        let tagList = this.state.timeEntry.tagIds ? this.state.timeEntry.tagIds : [];

        if(tagList.includes(tagId)) {
            tagList.splice(tagList.indexOf(tagId), 1);
        } else {
            tagList.push(tagId);
        }

        timeEntry.tagIds = tagList;

        this.setState({
            timeEntry: timeEntry
        }, () => this.checkRequiredFields());
    }

    editBillable() {
        let timeEntry = this.state.timeEntry;
        timeEntry.billable = !this.state.timeEntry.billable;

        this.setState({
            timeEntry: timeEntry
        });
    }

    deleteEntry() {
        ReactDOM.render(<HomePage/>, document.getElementById('mount'));
        let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
        if(timeEntries.findIndex(entryOffline => entryOffline.id === this.state.timeEntry.id) > -1) {
            timeEntries.splice( timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id), 1);
        }
        localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
    }

    checkRequiredFields() {
        let descRequired = false;
        let projectRequired = false;
        let taskRequired = false;
        let tagsRequired = false;
        let workspaceSettings;

        if (typeof this.props.workspaceSettings.forceDescription !== "undefined") {
            workspaceSettings = this.props.workspaceSettings;
        } else {
            workspaceSettings = localStorage.getItem('workspaceSettings') ?
                JSON.parse(localStorage.getItem('workspaceSettings')) : null
        }

        if (workspaceSettings) {
            if (workspaceSettings.forceDescription &&
                (!this.state.timeEntry.description || this.state.timeEntry.description === "")) {
                descRequired = true;
            }

            if (workspaceSettings.forceProjects && !this.state.timeEntry.projectId && !checkConnection()) {
                projectRequired = true;
            }

            if (workspaceSettings.forceTasks && !this.state.timeEntry.taskId && !checkConnection()) {
                taskRequired = true;
            }

            if (workspaceSettings.forceTags &&
                (!this.state.timeEntry.tagIds || !this.state.timeEntry.tagIds.length > 0) && !checkConnection()) {
                tagsRequired = true;
            }
        }

        this.setState({
            descRequired: descRequired,
            projectRequired: projectRequired,
            taskRequired: taskRequired,
            tagsRequired: tagsRequired,
            ready: true
        });
    }

    done() {
        if (
            this.state.descRequired ||
            this.state.projectRequired ||
            this.state.taskRequired ||
            this.state.tagsRequired
        ) {
            return;
        }
        if(checkConnection()) {
            let timeEntry = {
                id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                description: this.state.timeEntry.description,
                billable: this.state.timeEntry.billable,
                projectId: this.state.timeEntry.projectId,
                timeInterval: {
                    start: this.state.timeEntry.timeInterval.start,
                    end: this.state.timeEntry.timeInterval.end,
                    duration: duration(moment(this.state.timeEntry.timeInterval.end).diff(moment(this.state.timeEntry.timeInterval.start)))
                }
            };

            let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
            timeEntries.push(timeEntry);
            localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
            ReactDOM.render(<HomePage/>, document.getElementById('mount'));
        } else {
            if (this.state.descRequired || this.state.projectRequired || this.state.taskRequired || this.state.tagsRequired) {
                return;
            } else {
                timeEntryService.createEntry(
                    this.state.timeEntry.description,
                    this.state.timeEntry.timeInterval.start,
                    this.state.timeEntry.timeInterval.end,
                    this.state.timeEntry.projectId,
                    this.state.timeEntry.taskId,
                    this.state.timeEntry.tagIds,
                    this.state.timeEntry.billable
                ).then(response => {
                    let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                    if(timeEntries.findIndex(entryOffline => entryOffline.id === this.state.timeEntry.id) > -1) {
                        timeEntries.splice( timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id), 1);
                    }
                    localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
                    ReactDOM.render(<HomePage/>, document.getElementById('mount'));
                })
                    .catch(() => {
                    });
            }
        }
    }

    changeDate(date) {
        let getDate = new Date(date);
        let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
        let start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds());

        let timeEntry = this.state.timeEntry;
        timeEntry.timeInterval = {
            start: start,
            end: moment(start).add(timeEntry.timeInterval.duration),
            duration: timeEntry.timeInterval.duration
        };
        this.setState({
            timeEntry: timeEntry
        }, () => {
            this.setTime();
        });
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    askToDeleteEntry() {
        this.setState({
            askToDeleteEntry: true
        });
    }

    cancelDeletingEntry() {
        this.setState({
            askToDeleteEntry: false
        });
    }

    projectListOpened() {
        this.closeOtherDropdowns('projectList');
    }

    tagListOpened() {
        this.closeOtherDropdowns('tagList');
    }

    closeOtherDropdowns(openedDropdown) {
        switch(openedDropdown) {
            case 'projectList':
                this.tagList.setState({
                    isOpen: false
                });
                break;
            case 'tagList':
                this.projectList.setState({
                    isOpen: false
                });
                break;
        }
    }

    goBack() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<HomePage/>, document.getElementById('mount'));
    }

    notifyAboutError(message) {
        this.toaster.toast('error', message, 2);
    }

    render(){
        if(!this.state.ready) {
            return null;
        } else {
            return(
                <div>
                    <Header
                        backButton={true}
                        mode={localStorage.getItem('mode')}
                        disableManual={localStorage.getItem('inProgress')}
                        disableAutomatic={false}
                        changeMode={this.changeMode.bind(this)}
                        workspaceSettings={JSON.parse(localStorage.getItem('workspaceSettings'))}
                        goBackTo={this.goBack.bind(this)}
                    />
                    <Toaster
                        ref={instance => {
                            this.toaster = instance
                        }}
                    />
                    <Duration
                        ref={instance => {
                            this.duration = instance;
                        }}
                        timeEntry={this.state.timeEntry}
                        start={this.state.timeEntry.timeInterval.start}
                        end={this.state.timeEntry.timeInterval.end}
                        time={this.state.time}
                        changeInterval={this.changeInterval.bind(this)}
                        changeDuration={this.changeDuration.bind(this)}
                        changeDate={this.changeDate.bind(this)}
                        timeFormat={this.props.timeFormat}
                        isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                        workspaceSettings={this.props.workspaceSettings}
                        userSettings={this.props.userSettings}
                    />
                    <div className="edit-form">
                        <div className={this.state.descRequired ?
                            "description-textarea-required" : "description-textarea"}>
                            <textarea
                                placeholder={this.state.descRequired ? "Description (required)" : "Description"}
                                className={"edit-form-description"}
                                type="text"
                                value={this.state.timeEntry.description}
                                onChange={this.setDescription.bind(this)}
                            />
                        </div>
                        <div className="edit-form__project_list">
                            <ProjectList
                                ref={instance => {
                                    this.projectList = instance;
                                }}
                                selectedProject={this.state.timeEntry.projectId}
                                selectedTask={this.state.timeEntry.taskId}
                                selectProject={this.editProject.bind(this)}
                                selectTask={this.editTask.bind(this)}
                                noTasks={false}
                                workspaceSettings={this.props.workspaceSettings}
                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                createProject={true}
                                projectRequired={this.state.projectRequired}
                                taskRequired={this.state.taskRequired}
                                projectListOpened={this.projectListOpened.bind(this)}
                                timeEntry={this.state.timeEntry}
                                createProject={true}
                                editForm={false}
                            />
                        </div>
                        <TagsList
                            ref={instance => {
                                this.tagList = instance;
                            }}
                            tagIds={this.state.timeEntry.tagIds ? this.state.timeEntry.tagIds : []}
                            editTag={this.editTags.bind(this)}
                            tagsRequired={this.state.tagsRequired}
                            tagListOpened={this.tagListOpened.bind(this)}
                            isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                            workspaceSettings={this.props.workspaceSettings}
                            editForm={false}
                            errorMessage={this.notifyAboutError.bind(this)}
                        />
                        <div className="edit-form-buttons">
                            <div className="edit-form-buttons__billable">
                                <span className={this.state.timeEntry.billable ?
                                    "edit-form-checkbox checked" : "edit-form-checkbox"}
                                      onClick={this.editBillable.bind(this)}>
                                    <img src="./assets/images/checked.png"
                                         className={this.state.timeEntry.billable ?
                                             "edit-form-billable-img" : "edit-form-billable-img-hidden"}/>
                                </span>
                                <label onClick={this.editBillable.bind(this)}
                                       className="edit-form-billable">Billable</label>
                            </div>
                            <hr/>
                            <div className="edit-form-right-buttons">
                                <button onClick={this.done.bind(this)}
                                        className={
                                            this.state.descRequired || this.state.projectRequired ||
                                            this.state.taskRequired || this.state.tagsRequired ?
                                                "edit-form-done-disabled" : "edit-form-done"}>OK</button>
                                <div className="edit-form-right-buttons__back_and_delete">
                                    <span onClick={this.askToDeleteEntry.bind(this)}
                                          className="edit-form-delete">Delete</span>
                                </div>
                                <DeleteEntryConfirmationComponent askToDeleteEntry={this.state.askToDeleteEntry}
                                                                  canceled={this.cancelDeletingEntry.bind(this)}
                                                                  confirmed={this.deleteEntry.bind(this)}/>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default EditFormManual;
