import * as React from 'react';
import Header from './header.component';
import Duration from './duration.component';
import moment from 'moment';
import {duration} from 'moment/moment';
import ProjectList from './project-list.component';
import TagsList from './tags-list.component';
import * as ReactDOM from 'react-dom';
import HomePage from './home-page.component';
import RequiredFields from './required-fields.component';
import {checkConnection} from "./check-connection";
import {ProjectHelpers} from "../helpers/project-helpers";
import {TimeEntryService} from "../services/timeEntry-service";

const projectHelpers = new ProjectHelpers();
const timeEntryService = new TimeEntryService();

class EditFormManual extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            timeEntry: this.props.timeEntry,
            time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
            interval: '',
            ready: false
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
                            timeEntry: entry,
                            ready: true
                        });
                    });
            } else {
                const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
                projectHelpers.clearDefaultProjectForWorkspace(activeWorkspaceId);

                this.setState({
                    ready: true
                });
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

    changeDuration(duration){
        if (!duration) {
            return;
        }

        let timeEntry = this.state.timeEntry;

        let start = moment()
            .add(-parseInt(duration.split(':')[0]), 'hours')
            .add(-parseInt(duration.split(':')[1]), 'minutes')
            .add(-parseInt(duration.split(':')[2]), 'seconds');

        if(this.state.timeEntry.timeInterval.end) {
            start = moment(this.state.timeEntry.timeInterval.end)
                .add(-parseInt(duration.split(':')[0]), 'hours')
                .add(-parseInt(duration.split(':')[1]), 'minutes')
                .add(-parseInt(duration.split(':')[2]), 'seconds');
        }

        timeEntry.timeInterval.start = start;
        this.setState({
            timeEntry: timeEntry
        }, () => {
            this.setTime();
        });
    }

    setDescription(event) {

        let timeEntry = this.state.timeEntry;
        timeEntry.description =  event.target.value;
        this.setState({
            timeEntry: timeEntry
        });
    }

    editProject(project) {
        let timeEntry = this.state.timeEntry;
        timeEntry.projectId =  project.id;
        this.setState({
            timeEntry: timeEntry
        });
    }

    editTask(taskId, project) {
        let timeEntry = this.state.timeEntry;
        timeEntry.projectId =  project.id;
        timeEntry.taskId =  taskId;
        this.setState({
            timeEntry: timeEntry
        });
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
        });
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
        if(JSON.parse(localStorage.getItem('offline'))) {
            this.done();
        } else if(this.props.workspaceSettings.forceDescription &&
                    (this.state.timeEntry.description === "" || !this.state.timeEntry.description)) {
            ReactDOM.render(
                <RequiredFields field={"description"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else if(this.props.workspaceSettings.forceProjects && !this.state.timeEntry.projectId) {
            ReactDOM.render(
                <RequiredFields field={"project"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else if(this.props.workspaceSettings.forceTasks && !this.state.timeEntry.taskId) {
            ReactDOM.render(
                <RequiredFields field={"task"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else if(this.props.workspaceSettings.forceTags &&
                    (!this.state.timeEntry.tagIds || !this.state.timeEntry.tagIds.length > 0)) {
            ReactDOM.render(
                <RequiredFields field={"tags"}
                                goToEdit={this.goToEdit.bind(this)}/>,
                document.getElementById('mount')
            );
        } else {
            this.done();
        }
    }

    goToEdit() {
        ReactDOM.render(
            <EditFormManual timeEntry={this.state.timeEntry}
                            workspaceSettings={this.props.workspaceSettings}/>,
            document.getElementById('mount')
        );
    }

    done() {
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
            timeEntryService.createEntry(
                this.state.timeEntry.description,
                this.state.timeEntry.timeInterval.start,
                this.state.timeEntry.timeInterval.end,
                this.state.timeEntry.projectId,
                this.state.timeEntry.taskId,
                this.state.timeEntry.tagIds,
                this.state.timeEntry.billable
            ).then(response => {
                ReactDOM.render(<HomePage/>, document.getElementById('mount'));
                    let timeEntries = localStorage.getItem('timeEntriesOffline') ? JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];
                    if(timeEntries.findIndex(entryOffline => entryOffline.id === this.state.timeEntry.id) > -1) {
                        timeEntries.splice( timeEntries.findIndex(entry => entry.id === this.state.timeEntry.id), 1);
                    }
                    localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntries));
                })
                .catch(() => {
                });
        }
    }

    changeDate(date) {
        let getDate = new Date(date);
        let timeEntryStart = moment(this.state.timeEntry.timeInterval.start);
        let start = moment(getDate).hour(timeEntryStart.hour()).minutes(timeEntryStart.minutes()).seconds(timeEntryStart.seconds());

        let timeEntry = this.state.timeEntry;
        timeEntry.timeInterval = {
            start: start,
            end: moment(start).add(duration(this.state.timeEntry.timeInterval.duration))
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

    render(){
        if(!this.state.ready) {
            return null;
        } else {
            return(
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
                        changeInterval={this.changeInterval.bind(this)}
                        changeDuration={this.changeDuration.bind(this)}
                        changeDate={this.changeDate.bind(this)}
                        timeFormat={this.props.timeFormat}
                        isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                        workspaceSettings={this.props.workspaceSettings}
                    />
                    <div className="edit-form">
                        <div className="description-textarea">
                        <textarea
                            placeholder={"What's up"}
                            className="edit-form-description"
                            type="text"
                            value={this.state.timeEntry.description}
                            onChange={this.setDescription.bind(this)}
                        />
                        </div>
                        <ProjectList
                            selectedProject={this.state.timeEntry.projectId}
                            selectedTask={this.state.timeEntry.taskId}
                            selectProject={this.editProject.bind(this)}
                            selectTask={this.editTask.bind(this)}
                            noTasks={false}
                            workspaceSettings={this.props.workspaceSettings}
                        />
                        <TagsList
                            tagIds={this.state.timeEntry.tagIds ? this.state.timeEntry.tagIds : []}
                            editTag={this.editTags.bind(this)}
                        />
                        <div className="edit-form-buttons">
                        <span className="edit-form-checkbox" onClick={this.editBillable.bind(this)}>
                            <img src="./assets/images/checked.png" className={this.state.timeEntry.billable ? "edit-form-billable-img" : "edit-form-billable-img-hidden"}/>
                        </span>
                            <label onClick={this.editBillable.bind(this)} className="edit-form-billable">Billable</label>
                            <span className="edit-form-right-buttons">
                            <span onClick={this.deleteEntry.bind(this)} className="edit-form-delete">Delete</span>
                            <button onClick={this.checkRequiredFields.bind(this)} className="edit-form-done">OK</button>
                        </span>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default EditFormManual;