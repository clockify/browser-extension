import React from "react";
import ReactDOM from "react-dom";
import Header from "./header.component";
import Toaster from "./toaster-component";
import EditForm from "./edit-form.component";
import EditFormManual from "./edit-form-manual.component";
import {ProjectService} from "../services/project-service";
import {TimeEntryService} from "../services/timeEntry-service";
import locales from "../helpers/locales";

const projectService = new ProjectService();
const timeEntryService = new TimeEntryService();

class CreateTask extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            taskName: '',
        }
        this.addTask = this.addTask.bind(this);
        this.cancel = this.cancel.bind(this);
    }

    componentDidMount() {
        this.taskName.focus();
    }

    addTask() {
        const {taskName} = this.state;
        const {project} = this.props;
        
        if (!taskName) {
            this.toaster.toast('error', locales.NAME_IS_REQUIRED, 2);
            return;
        }

        const task = {
            name: taskName,
            projectId: project.id
        }

        projectService.createTask(task)
            .then(response => {
                const timeEntry = Object.assign(this.props.timeEntry, {
                    taskId: response.data.id,
                    projectId: response.data.projectId,
                    task: Object.assign(task, {id: response.data.id}),
                    project,
                    billable: project.billable,
                    clientId: project.clientId,
                    color: project.color,
                    isPublic: project.isPublic
                });
                this.goBackToEdit(timeEntry);
            })
            .catch(error => {
                this.toaster.toast('error', locales.replaceLabels(error.response.data.message), 2);
            });
    }

    handleChange(event) {
        this.setState({
            taskName: event.target.value
        });
    }

    cancel() {
        this.goBackToEdit(this.props.timeEntry);
    }

    goBackToEdit(timeEntry) {
        if (this.props.editForm) {
            if (timeEntry.projectId && timeEntry.taskId && timeEntry.id) {
                timeEntryService.updateTask(timeEntry.taskId, timeEntry.projectId, timeEntry.id);
            }
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <EditForm
                    timeEntry={timeEntry}
                    workspaceSettings={this.props.workspaceSettings}
                    timeFormat={this.props.timeFormat}
                    userSettings={this.props.userSettings}
                    afterCreateProject={true}
                />,
                document.getElementById('mount')
            );
        } else {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <EditFormManual
                    timeEntry={timeEntry}
                    workspaceSettings={this.props.workspaceSettings}
                    timeFormat={this.props.timeFormat}
                    userSettings={this.props.userSettings}
                    afterCreateProject={true}
                />,
                document.getElementById('mount')
            );
        }
    }

    render() {
        return (
            <div>
                <Header
                    showActions={false}
                    backButton={true}
                    goBackTo={this.cancel.bind(this)}
                />
                <Toaster
                    ref={instance => {this.toaster = instance}}
                />
                <input
                    ref={input => {this.taskName = input}}
                    className="create-task__task-name"
                    placeholder={locales.TASK_NAME}
                    value={this.state.taskName}
                    onChange={this.handleChange.bind(this)}>
                </input>

                <div className="create-task__actions">
                    <span
                        onClick={this.addTask}
                        className="create-task__add-button">{locales.CREATE_NEW_TASK}</span>
                    <span onClick={this.cancel}
                          className="create-task__cancel">{locales.CANCEL}</span>
                </div>
            </div>
        )
    }
}

export default CreateTask;