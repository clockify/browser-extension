import * as React from 'react';
import Header from './header.component';
import Duration from './duration.component';
import moment, {duration} from 'moment';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import * as ReactDOM from 'react-dom';
import HomePage from "./home-page.component";
import {checkConnection} from "./check-connection";
import {ProjectHelper} from "../helpers/project-helper";
import {TimeEntryService} from "../services/timeEntry-service";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {getBrowser} from "../helpers/browser-helper";
import DeleteEntryConfirmationComponent from "./delete-entry-confirmation.component";
import Toaster from "./toaster-component";
import {LocalStorageService} from "../services/localStorage-service";
import EditDescription from './edit-description.component'

const projectHelpers = new ProjectHelper();
const timeEntryService = new TimeEntryService();
const localStorageService = new LocalStorageService();

class EditForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            timeEntry: this.props.timeEntry,
            time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
            interval: "",
            changeDescription: false,
            description: this.props.timeEntry.description,
            ready: false,
            descRequired: false,
            projectRequired: false,
            taskRequired: false,
            tagsRequired: false,
            askToDeleteEntry: false,
            tags: this.props.timeEntry.tags ? this.props.timeEntry.tags : []
        };

        this.setDescription = this.setDescription.bind(this);
        this.onSetDescription = this.onSetDescription.bind(this);
        this.editBillable = this.editBillable.bind(this);
        this.checkRequiredFields = this.checkRequiredFields.bind(this)
    }

    componentDidMount() {
        this.checkForDefaultProject();
        this.setTime();
    }

    async checkForDefaultProject() {
        const entry = this.state.timeEntry;
        if (!projectHelpers.isDefaultProjectEnabled()) {
            this.setState({
                timeEntry: entry
            }, () => {
                this.checkRequiredFields()
            });
            return; 
        }
        const defaultProject = await projectHelpers.getDefaultProject();
            if (defaultProject && !defaultProject.archived) {
                this.setState({
                    timeEntry: entry
                }, () => {
                    this.checkRequiredFields()
                });
                if (!entry.projectId) {
                    entry.projectId = defaultProject.id
                    entry.billable = defaultProject.billable;
                    this.editProject(defaultProject);
                }
            } else {
                this.checkRequiredFields();
                const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
                const userId = localStorageService.get('userId');
                projectHelpers.removeDefaultProjectForWorkspaceAndUser(activeWorkspaceId, userId);
                this.toaster.toast(
                    'info',
                    "Your default project is no longer available. You can set a new one in Settings.",
                    2
                );
            }
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
        if (JSON.parse(localStorage.getItem('offline'))) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.timeInterval = timeInterval;
                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntry));
                this.setState({
                    timeEntry: timeEntry
                }, () => {
                    this.setTime();
                })
            } else {
                let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                timeEntries.map(entry => {
                    if (entry.id === this.state.timeEntry.id) {
                        entry.timeInterval = timeInterval;
                        this.setState({
                            timeEntry: entry
                        }, () => {
                            this.setTime();
                        })
                    }
                    return entry;
                });

                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
            }
        } else {
            if (timeInterval.start && timeInterval.end) {
                timeEntryService.editTimeInterval(
                    this.props.timeEntry.id,
                    timeInterval
                ).then(response => {
                    let data = response.data;
                    this.setState({
                        timeEntry: data
                    }, () => {
                        this.setTime();
                    });
                }).catch((error) => {});
            } else if (timeInterval.start && !timeInterval.end) {
                timeEntryService.changeStart(
                    timeInterval.start,
                    this.props.timeEntry.id
                ).then(response => {
                    let data = response.data;
                    this.setState({
                        timeEntry: data
                    }, () => {
                        this.setTime();
                        if (isAppTypeExtension()) {
                            getBrowser().extension.getBackgroundPage().addPomodoroTimer();
                        }
                    });
                }).catch((error) => {});
            }
        }
    }

    changeDuration(newDuration) {
        if (!newDuration || !this.state.timeEntry.timeInterval.end) {
            return;
        }
        let timeEntry;

        if (JSON.parse(localStorage.getItem('offline'))) {
            timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            let end = moment(this.state.timeEntry.timeInterval.start)
                .add(parseInt(newDuration.split(':')[0]), 'hours')
                .add(parseInt(newDuration.split(':')[1]), 'minutes')
                .add(newDuration.split(':')[2] ?
                    parseInt(newDuration.split(':')[2]) : 0,
                    'seconds');

            if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.timeInterval.end = end;
                timeEntry.timeInterval.duration = duration(moment(timeEntry.timeInterval.end).diff(timeEntry.timeInterval.start));
                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntry));
                this.setState({
                    timeEntry: timeEntry
                }, () => {
                    this.setTime();
                    this.duration.setState({
                        startTime: moment(timeEntry.timeInterval.start),
                        endTime: moment(timeEntry.timeInterval.end)
                    });
                })
            } else {
                let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                timeEntries.map(entry => {
                    if (entry.id === this.state.timeEntry.id) {
                        entry.timeInterval.end = end;
                        entry.timeInterval.duration = duration(moment(entry.timeInterval.end).diff(entry.timeInterval.start));
                        this.setState({
                            timeEntry: entry
                        }, () => {
                            this.setTime();
                            this.duration.setState({
                                startTime: moment(entry.timeInterval.start),
                                endTime: moment(entry.timeInterval.end)
                            });
                        })
                    }
                    return entry;
                });

                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
            }
        } else {
            timeEntry = this.state.timeEntry;
            let end =
                moment(this.state.timeEntry.timeInterval.start)
                    .add(parseInt(newDuration.split(':')[0]), 'hours')
                    .add(parseInt(newDuration.split(':')[1]), 'minutes')
                    .add(newDuration.split(':')[2] ?
                        parseInt(newDuration.split(':')[2]) : 0,
                        'seconds');

            timeEntry.timeInterval.end = end;

            timeEntryService.editTimeInterval(
                this.props.timeEntry.id,
                timeEntry.timeInterval
            ).then(response => {
                let data = response.data;
                this.setState({
                    timeEntry: data
                }, () => {
                    this.setTime();
                    this.duration.setState({
                        startTime: moment(data.timeInterval.start),
                        endTime: moment(data.timeInterval.end)
                    });
                });
            }).catch(() => {});
        }
    }

    onSetDescription(description) {
        this.setState({ description }, 
            () => this.setDescription())
    }

    setDescription() {
        const { description } = this.state;
        if(JSON.parse(localStorage.getItem('offline'))) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            if(timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.description = description.trim();
                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntry));
                this.setState({
                    timeEntry: timeEntry,
                    description: timeEntry.description + descripton.endsWith(' ') ? ' ' : ''
                }, () => this.checkRequiredFields());
            } else {
                let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                timeEntries.map(entry => {
                    if(entry.id === this.state.timeEntry.id) {
                        entry.description = description.trim();
                        this.setState({
                            timeEntry: entry,
                            description: entry.description + descripton.endsWith(' ') ? ' ' : ''
                        }, () => this.checkRequiredFields());
                    }
                    return entry;
                });

                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
            }
        } else {
            timeEntryService.setDescription(this.state.timeEntry.id, description.trim())
                .then(response => {
                    let data = response.data;
                    setTimeout(() => {
                        this.setState({
                            timeEntry: data,
                            description: data.description + description.endsWith(' ') ? ' ' : ''
                        }, () => this.checkRequiredFields());
                    }, 100);
                })
                .catch(() => {
                });
        }
    }

    editProject(project) {
        if(!project.id) {
            timeEntryService.removeProject(this.state.timeEntry.id)
                .then((response) => {
                    let entry = this.state.timeEntry
                    entry.projectId = null
                    this.setState({
                        timeEntry: entry
                    }, () => {
                        this.checkRequiredFields()
                        this.projectList.mapSelectedProject()
                    })
                })
                .catch((error) => {
                });
        } else {
            timeEntryService.updateProject(project.id, this.state.timeEntry.id)
                .then(response => {
                    this.setState({
                        timeEntry: response.data
                    }, () => {
                        this.checkRequiredFields()
                        this.projectList.mapSelectedProject()
                    });
            })
        }
    }

    editTask(task, project) {
        if (!task) {
            timeEntryService.removeTask(this.state.timeEntry.id)
                .then(() => this.checkRequiredFields())
                .catch(() => {
                });
        } else {
            timeEntryService.updateTask(task.id, project.id, this.state.timeEntry.id)
                .then(response => {
                    this.setState({
                        timeEntry: response.data
                    }, () => this.checkRequiredFields());
                })
                .catch(() => {
                });
        }
    }

    editTags(tag) {
        let tagIds = this.state.tags ? this.state.tags.map(it => it.id) : [];
        let tagList = this.state.tags;

        if(tagIds.includes(tag.id)) {
            tagIds.splice(tagIds.indexOf(tag.id), 1);
            tagList = tagList.filter(t => t.id !== tag.id)
        } else {
            tagIds.push(tag.id);
            tagList.push(tag)
        }

        timeEntryService.updateTags(tagIds, this.state.timeEntry.id)
            .then(response => {
                let data = response.data;
                this.setState({
                    timeEntry: data,
                    tags: tagList
                }, () => this.checkRequiredFields());
            })
            .catch(() => {
            })
    }

    editBillable() {
        if(JSON.parse(localStorage.getItem('offline'))) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            if(timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.billable = !this.state.timeEntry.billable;
                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntry));
                this.setState({
                    timeEntry: timeEntry
                })
            } else {
                let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                timeEntries.map(entry => {
                    if(entry.id === this.state.timeEntry.id) {
                        entry.billable = !this.state.timeEntry.billable;
                        this.setState({
                            timeEntry: entry
                        })
                    }
                    return entry;
                });

                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
            }
        } else {
            timeEntryService.updateBillable(!this.state.timeEntry.billable, this.state.timeEntry.id)
                .then(response => {
                    let data = response.data;
                    this.setState({
                        timeEntry: data
                    })
                })
                .catch(() => {
                });
        }
    }

    deleteEntry() {
        if (this.state.interval) {
            clearInterval(this.state.interval);
        }
        if(checkConnection()) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            if(timeEntry && timeEntry.id === this.state.timeEntry.id) {
                localStorage.setItem('timeEntryInOffline', null);
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            } else {
                let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                if(timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id) > -1) {
                    timeEntries.splice( timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id), 1);
                }
                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
            }
        } else {
            timeEntryService.deleteTimeEntry(this.state.timeEntry.id)
                .then(response => {
                    if (isAppTypeExtension()) {
                        getBrowser().extension.getBackgroundPage().restartPomodoro();
                        getBrowser().extension.getBackgroundPage().entryInProgressChangedEventHandler(null);
                    }
                    ReactDOM.render(<HomePage/>, document.getElementById('mount'));
                })
                .catch(() => {
                })
        }
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
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<HomePage/>, document.getElementById('mount'));
    }

    changeDate(date) {
        if(JSON.parse(localStorage.getItem('offline'))) {
            let getDate = new Date(date);
            let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
            let start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds());
            let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
            timeEntries.map(entry => {
                if(entry.id === this.state.timeEntry.id) {
                    entry.timeInterval.start = start;
                    entry.timeInterval.end = moment(start).add(duration(this.state.timeEntry.timeInterval.duration));
                    this.setState({
                        timeEntry: entry
                    })
                }
                return entry;
            });

            localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
        } else {

            let getDate = new Date(date);
            let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
            let start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds());
            let body = {
                start: start,
                end: moment(start).add(duration(this.state.timeEntry.timeInterval.duration))
            };
            timeEntryService.editTimeInterval(this.state.timeEntry.id, body)
                .then(response => {
                    this.setState({
                        timeEntry: response.data
                    });
                });
        }
    }

    changeStartDate(date) {
        if(JSON.parse(localStorage.getItem('offline'))) {
            let getDate = new Date(date);
            let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            timeEntry.timeInterval.start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds());
            localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntry));
            this.setState({
                timeEntry: timeEntry
            })
        } else {

            const getDate = new Date(date);
            const timeEntryStart = moment(this.state.timeEntry.timeInterval.start);

            const start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds())

            timeEntryService.changeStart(start, this.state.timeEntry.id)
                .then(response => {
                    this.setState({
                        timeEntry: response.data
                    }, () => {
                        this.setTime();
                    })
                });
        }
    }

    changeMode(mode) {
        this.props.changeMode(mode);
    }

    getDescription(event) {
        document.getElementById('description-edit').value = event.target.value;
        this.setState({
            changeDescription: true
        })
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
                (!this.state.timeEntry.description || this.state.timeEntry.description === "")
            ) {
                descRequired = true;
            }

            if (workspaceSettings.forceProjects &&
                !this.state.timeEntry.projectId &&
                !checkConnection()
            ) {
                projectRequired = true;
            }

            if (
                workspaceSettings.forceTasks &&
                !this.state.timeEntry.task &&
                !this.state.timeEntry.taskId &&
                !checkConnection()
            ) {
                taskRequired = true;
            }

            if (workspaceSettings.forceTags &&
                (!this.state.timeEntry.tags || !this.state.timeEntry.tags.length > 0) &&
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
            return (
                <div>
                    <Header
                        backButton={true}
                        mode={localStorage.getItem('mode')}
                        disableManual={localStorage.getItem('inProgress')}
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
                        timeFormat={this.props.timeFormat}
                        changeInterval={this.changeInterval.bind(this)}
                        changeDuration={this.changeDuration.bind(this)}
                        changeDate={this.state.timeEntry.timeInterval.end ? this.changeDate.bind(this) : this.changeStartDate.bind(this)}
                        workspaceSettings={this.props.workspaceSettings}
                        isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                        userSettings={this.props.userSettings}
                    />
                    <div className="edit-form">
                        <div className={this.state.descRequired ?
                            "description-textarea-required" : "description-textarea"}>
                            <EditDescription 
                                description={this.state.description}
                                descRequired={this.descRequired}
                                onSetDescription={this.onSetDescription} 
                            />
                        </div>
                        <div className="edit-form__project_list">
                            <ProjectList
                                ref={instance => {
                                    this.projectList = instance;
                                }}
                                selectedProject={this.state.timeEntry.projectId}
                                selectedTask={this.state.timeEntry.task ? this.state.timeEntry.task.id : null}
                                selectProject={this.editProject.bind(this)}
                                selectTask={this.editTask.bind(this)}
                                noTask={false}
                                workspaceSettings={this.props.workspaceSettings}
                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                createProject={true}
                                projectRequired={this.state.projectRequired}
                                taskRequired={this.state.taskRequired}
                                projectListOpened={this.projectListOpened.bind(this)}
                                timeEntry={this.state.timeEntry}
                                editForm={true}
                                timeFormat={this.props.timeFormat}
                                userSettings={this.props.userSettings}
                            />
                        </div>
                        <TagsList
                            ref={instance => {
                                this.tagList = instance;
                            }}
                            tags={this.state.tags}
                            tagIds={this.state.tags.map(it => it.id)}
                            editTag={this.editTags.bind(this)}
                            tagsRequired={this.state.tagsRequired}
                            tagListOpened={this.tagListOpened.bind(this)}
                            isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                            workspaceSettings={this.props.workspaceSettings}
                            editForm={true}
                            errorMessage={this.notifyAboutError.bind(this)}
                        />
                        <div className="edit-form-buttons">
                            <div className="edit-form-buttons__billable">
                                <span className={this.state.timeEntry.billable ?
                                    "edit-form-checkbox checked" : "edit-form-checkbox"}
                                    onClick={this.editBillable}
                                    tabIndex={"0"} 
                                    onKeyDown={e => {if (e.key==='Enter') this.editBillable()}}
                                >
                                    <img src="./assets/images/checked.png"
                                         className={this.state.timeEntry.billable ?
                                             "edit-form-billable-img" :
                                             "edit-form-billable-img-hidden"
                                         }/>
                                </span>
                                <label onClick={this.editBillable}
                                       className="edit-form-billable">Billable</label>
                            </div>
                            <hr/>
                            <div className="edit-form-right-buttons">
                                <button onClick={this.done.bind(this)}
                                        className={
                                            this.state.descRequired || this.state.projectRequired ||
                                            this.state.taskRequired || this.state.tagsRequired ?
                                                "edit-form-done-disabled" : "edit-form-done"}>OK
                                </button>
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

export default EditForm;