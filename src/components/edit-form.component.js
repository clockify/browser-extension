import * as React from 'react';
import Header from './header.component';
import Duration from './duration.component';
import moment from 'moment';
import {duration} from 'moment/moment';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import * as ReactDOM from 'react-dom';
import HomePage from "./home-page.component";
import {checkConnection} from "./check-connection";
import {ProjectHelpers} from "../helpers/project-helpers";
import {TimeEntryService} from "../services/timeEntry-service";
import {isAppTypeMobile} from "../helpers/app-types-helpers";

const projectHelpers = new ProjectHelpers();
const timeEntryService = new TimeEntryService();

class EditForm extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            timeEntry: this.props.timeEntry,
            time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
            interval: "",
            changeDescription: false,
            ready: false
        };
    }

    componentDidMount() {
        projectHelpers.getDefaultProject().then(defaultProject => {
            if (defaultProject) {
                projectHelpers.setDefaultProjectToEntryIfNotSet(this.state.timeEntry)
                    .then(timeEntry => {
                        let entry = timeEntry;
                        entry.billable = defaultProject.billable;
                        this.setState({
                            timeEntry: entry,
                            ready: true
                        });
                    });
                if (!this.props.timeEntry.projectId) {
                    this.editProject(defaultProject);
                }
            } else {
                const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
                projectHelpers.clearDefaultProjectForWorkspace(activeWorkspaceId);

                this.setState({
                    ready: true
                });
            }
        });

        this.setTime();

        if (isAppTypeMobile()) {
            this.getEntryInProgressOnResume();
        }
    }

    getEntryInProgressOnResume() {
        document.addEventListener("resume", () => {
            timeEntryService.getEntryInProgress().then(response => {
                let data = response.data;
                if(data) {
                    this.setState({
                        timeEntry: data
                    }, () => {
                        this.setTime();
                    });
                }
            });
        });
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
                    }).catch(() => {});
                });
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
                    }).catch(() => {});
                });
            }
        }
    }

    changeDuration(duration) {
        if (JSON.parse(localStorage.getItem('offline'))) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            let start = moment().add(-parseInt(duration.split(':')[0]), 'hours').add(-parseInt(duration.split(':')[1]), 'minutes').add(-parseInt(duration.split(':')[2]), 'seconds');
            if (this.state.timeEntry.timeInterval.end) {
                start = moment(this.state.timeEntry.timeInterval.end).add(-parseInt(duration.split(':')[0]), 'hours').add(-parseInt(duration.split(':')[1]), 'minutes').add(-parseInt(duration.split(':')[2]), 'seconds');
            }
            if (timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.timeInterval.start = start;
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
                        entry.timeInterval.start = start;
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
            let start =
                moment().add(-parseInt(duration.split(':')[0]), 'hours')
                    .add(-parseInt(duration.split(':')[1]), 'minutes')
                    .add(-parseInt(duration.split(':')[2]), 'seconds');

            if (this.state.timeEntry.timeInterval.end) {
                start =
                    moment(this.state.timeEntry.timeInterval.end)
                        .add(-parseInt(duration.split(':')[0]), 'hours')
                        .add(-parseInt(duration.split(':')[1]), 'minutes')
                        .add(-parseInt(duration.split(':')[2]), 'seconds');
            }

            timeEntryService.changeStart(
                start,
                this.props.timeEntry.id
            ).then(response => {
                let data = response.data;
                this.setState({
                    timeEntry: data
                }, () => {
                    this.setTime();
                }).catch(() => {})

            });
        }
    }

    setDescription(event) {
        if(JSON.parse(localStorage.getItem('offline'))) {
            let timeEntry = localStorage.getItem('timeEntryInOffline') ? JSON.parse(localStorage.getItem('timeEntryInOffline')) : null;
            if(timeEntry && timeEntry.id === this.state.timeEntry.id) {
                timeEntry.description = event.target.value;
                localStorage.setItem('timeEntryInOffline', JSON.stringify(timeEntry));
                this.setState({
                    timeEntry: timeEntry
                })
            } else {
                let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                timeEntries.map(entry => {
                    if(entry.id === this.state.timeEntry.id) {
                        entry.description = event.target.value;
                        this.setState({
                            timeEntry: entry
                        })
                    }
                    return entry;
                });

                localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
            }
        } else {
            const description = event.target.value;
            timeEntryService.setDescription(this.state.timeEntry.id, description)
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

    editProject(project) {
        if(!project.id) {
            timeEntryService.removeProject(this.state.timeEntry.id)
                .then((response) => {})
                .catch((error) => {
                });
        } else {
            timeEntryService.updateProject(project.id, this.state.timeEntry.id)
                .then(response => {
                    this.setState({
                        timeEntry: response.data
                    })
                })
                .catch((error) => {
                });
        }
    }

    editTask(taskId, project) {
        if (!taskId) {
            timeEntryService.removeTask(this.state.timeEntry.id)
                .then(() => {})
                .catch(() => {
                });
        } else {
            timeEntryService.updateTask(taskId, project.id, this.state.timeEntry.id)
                .then(response => {
                    this.setState({
                        timeEntry: response.data
                    })
                })
                .catch(() => {
                });
        }

    }

    editTags(tagId) {
        let tagList = this.state.timeEntry.tagIds ? this.state.timeEntry.tagIds : [];

        if(tagList.indexOf(tagId) > -1) {
            tagList.splice(tagList.indexOf(tagId), 1);
        } else {
            tagList.push(tagId);
        }

        timeEntryService.updateTags(tagList, this.state.timeEntry.id)
            .then(response => {
                let data = response.data;
                this.setState({
                    timeEntry: data
                })
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
                    ReactDOM.render(<HomePage/>, document.getElementById('mount'));
                })
                .catch(() => {
                })
        }
    }

    done() {
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

    render(){
        if(!this.state.ready) {
            return null;
        } else {
            return (
                <div>
                    <Header
                        showActions={true}
                        mode={localStorage.getItem('mode')}
                        disableManual={localStorage.getItem('inProgress')}
                        changeMode={this.changeMode.bind(this)}
                    />
                    <Duration
                        timeEntry={this.state.timeEntry}
                        start={this.state.timeEntry.timeInterval.start}
                        end={this.state.timeEntry.timeInterval.end}
                        time={this.state.time}
                        timeFormat={this.props.timeFormat}
                        changeInterval={this.changeInterval.bind(this)}
                        changeDuration={this.changeDuration.bind(this)}
                        changeDate={this.state.timeEntry.timeInterval.end ? this.changeDate.bind(this) : this.changeStartDate.bind(this)}
                    />
                    <div className="edit-form">
                        <div className="description-textarea">
                            <textarea
                                className={!this.state.changeDescription ? "edit-form-description" : "disabled"}
                                placeholder={"What's up"}
                                id="description"
                                type="text"
                                value={this.state.timeEntry.description}
                                onFocus={this.getDescription.bind(this)}>
                            </textarea>
                            <textarea
                                className={this.state.changeDescription ? "edit-form-description" : "disabled"}
                                placeholder={"What's up"}
                                type="text"
                                id={"description-edit"}
                                onBlur={this.setDescription.bind(this)}
                            />
                        </div>
                        <ProjectList
                            selectedProject={this.state.timeEntry.projectId}
                            selectedTask={this.state.timeEntry.taskId}
                            selectProject={this.editProject.bind(this)}
                            selectTask={this.editTask.bind(this)}
                            noTask={false}
                            workspaceSettings={this.props.workspaceSettings}
                        />
                        <TagsList
                            tagIds={this.state.timeEntry.tagIds ? this.state.timeEntry.tagIds : []}
                            editTag={this.editTags.bind(this)}
                        />
                        <div className="edit-form-buttons">
                            <span className="edit-form-checkbox"
                                  onClick={this.editBillable.bind(this)}>
                                <img src="./assets/images/checked.png"
                                     className={this.state.timeEntry.billable ?
                                                 "edit-form-billable-img" :
                                                 "edit-form-billable-img-hidden"
                                     }/>
                            </span>
                            <label onClick={this.editBillable.bind(this)}
                                   className="edit-form-billable">Billable</label>
                            <span className="edit-form-right-buttons">
                                <span onClick={this.deleteEntry.bind(this)}
                                      className="edit-form-delete">Delete</span>
                                <button onClick={this.done.bind(this)}
                                        className="edit-form-done">OK
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default EditForm;