import * as React from "react";
import Header from "./header.component";
import ClientListComponent from "./client-list.component";
import ColorPicker from "./color-picker.component";
import Toaster from "./toaster-component";
import {ProjectService} from "../services/project-service";
import * as ReactDOM from "react-dom";
import EditForm from "./edit-form.component";
import EditFormManual from "./edit-form-manual.component";
import {TimeEntryService} from "../services/timeEntry-service";
import locales from "../helpers/locales";
import { UserService } from "../services/user-service";
import {LocalStorageService} from "../services/localStorage-service";

const projectService = new ProjectService();
const timeEntryService = new TimeEntryService();
const userService = new UserService();
const localStorageService = new LocalStorageService();
class CreateProjectComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            projectName: props.projectName,
            client: null,
            selectedColor: null,
            billable: false,
            public: false
        }
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
    }

    async setAsyncStateItems() {
        const wsSettings = await localStorage.getItem('workspaceSettings');
        const billable = wsSettings ? JSON.parse(wsSettings).defaultBillableProjects : false;
        const isProjectPublicByDefault = wsSettings ? JSON.parse(wsSettings).isProjectPublicByDefault : false;
        this.setState({
            billable,
            public: isProjectPublicByDefault
        });
    }

    componentDidMount() {
        this.projectName.focus();
        this.setAsyncStateItems();
    }

    selectClient(client) {
        this.setState({
            client: client
        });
    }

    selectColor(color) {
        this.setState({
            selectedColor: color
        });
    }

    toggleBillable() {
        this.setState({
            billable: !this.state.billable
        })
    }

    togglePublic() {
        this.setState({
            public: !this.state.public
        })
    }

    addProject() {
        const {projectName, client, selectedColor, billable} = this.state;
        
        if (!projectName || !selectedColor) {
            this.toaster.toast('error', locales.NAME_AND_COLOR_ARE_REQUIRED, 2);
            return;
        }

        if (projectName.length < 2 || projectName.length > 250) {
            this.toaster.toast('error', locales.PROJECT_NAME_LENGTH_ERROR, 2);
            return;
        }

        const project = {
            name: projectName,
            clientId: client ? client.id : "",
            color: selectedColor,
            billable,
            isPublic: this.state.public
        }

        projectService.createProject(project)
            .then(async response => {
                const timeEntry = Object.assign(this.props.timeEntry, {
                    projectId: response.data.id,
                    billable,
                    project,
                    taskId: null,
                    task: null
                });
                const userId = await localStorageService.get('userId');
                const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
                userService.getUserRoles(activeWorkspaceId, userId)
                    .then(response => {
                        if (response && response.data && response.data.userRoles) {
                            const { userRoles } = response.data;
                            localStorage.setItem('userRoles', userRoles);
                        }
                        else {
                            console.log('getUserRoles problem')
                        }
                        this.goBackToEdit(timeEntry);
                    })
                    .catch((error) => {
                        console.log("getUserRoles() failure");
                        this.goBackToEdit(timeEntry);
                    });
            })
            .catch(error => {
                this.toaster.toast('error', locales.replaceLabels(error.response.data.message), 2);
            });
    }

    handleChange(event) {
        this.setState({
            projectName: event.target.value
        });
    }

    cancel() {
        this.goBackToEdit(this.props.timeEntry);
    }

    goBackToEdit(timeEntry) {
        if (this.props.editForm) {
            if (timeEntry.projectId) {
                timeEntryService.updateProject(timeEntry.projectId, timeEntry.id);
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

    notifyAboutError(message) {
        this.toaster.toast('error', locales.replaceLabels(message), 2);
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
                    ref={input => {this.projectName = input}}
                    className="create-project__project-name"
                    placeholder={locales.PROJECT_NAME}
                    value={this.state.projectName}
                    onChange={this.handleChange.bind(this)}>
                </input>
                <div className="create-project__client-list">
                    <ClientListComponent
                        ref={instance => {
                            this.clientList = instance;
                        }}
                        selectedClient={this.selectClient.bind(this)}
                        errorMessage={this.notifyAboutError.bind(this)}
                    />
                </div>
                <div>
                    <ColorPicker
                        selectedColor={this.selectColor.bind(this)}
                    />
                </div>
                <div className="create-project__billable">
                                <span className={this.state.billable ?
                                    "create-project__checkbox checked" : "create-project__checkbox"}
                                      onClick={this.toggleBillable.bind(this)}>
                                    <img src="./assets/images/checked.png"
                                         className={this.state.billable ?
                                             "create-project__billable-img" :
                                             "create-project__billable-img-hidden"}/>
                                </span>
                    <label onClick={this.toggleBillable.bind(this)}
                           className="create-project__billable-title">{locales.BILLABLE_LABEL}</label>
                </div>


                <div className="create-project__public">
                                <span className={this.state.public ?
                                    "create-project__checkbox checked" : "create-project__checkbox"}
                                      onClick={this.togglePublic.bind(this)}>
                                    <img src="./assets/images/checked.png"
                                         className={this.state.public ?
                                             "create-project__public-img" :
                                             "create-project__public-img-hidden"}/>
                                </span>
                    <label onClick={this.togglePublic.bind(this)}
                           className="create-project__public-title">{locales.PUBLIC}</label>
                </div>
                <div className="create-project__divider"></div>
                <div className="create-project__actions">
                    <span
                        onClick={this.addProject.bind(this)}
                        className="create-project__add-button">{locales.CREATE_NEW_PROJECT}</span>
                    <span onClick={this.cancel.bind(this)}
                          className="create-project__cancel">{locales.CANCEL}</span>
                </div>
            </div>
        )
    }
}

export default CreateProjectComponent;