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

const projectService = new ProjectService();
const timeEntryService = new TimeEntryService();

class CreateProjectComponent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            projectName: "",
            client: null,
            selectedColor: null,
            billable: false
        }
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

    addProject() {
        let project = {};
        if (!this.state.projectName || !this.state.selectedColor) {
            this.toaster.toast('error', 'Name and color are required', 2);
            return;
        }
        project.name = this.state.projectName;
        project.clientId = this.state.client ? this.state.client.id : "";
        project.color = this.state.selectedColor;
        project.billable = this.state.billable;

        projectService.createProject(project).then(response => {
            let timeEntry = this.props.timeEntry;
            timeEntry.projectId = response.data.id;
            this.goBackToEdit(timeEntry);
        }).catch(error => {
            this.toaster.toast('error', error.response.data.message, 2);
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
                <EditForm timeEntry={timeEntry}
                          workspaceSettings={this.props.workspaceSettings}
                          timeFormat={this.props.timeFormat}
                          isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                          userSettings={this.props.userSettings}/>,
                document.getElementById('mount')
            );
        } else {
            ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
            ReactDOM.render(
                <EditFormManual timeEntry={timeEntry}
                          workspaceSettings={this.props.workspaceSettings}
                          timeFormat={this.props.timeFormat}
                          isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                          userSettings={this.props.userSettings}/>,
                document.getElementById('mount')
            );
        }
    }

    notifyAboutError(message) {
        this.toaster.toast('error', message, 2);
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
                    ref={instance => {
                        this.toaster = instance
                    }}
                />
                <input
                    className="create-project__project-name"
                    placeholder="Project name"
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
                           className="create-project__billable-title">Billable</label>
                </div>
                <div class="create-project__divider"></div>
                <div className="create-project__actions">
                    <span
                        onClick={this.addProject.bind(this)}
                        className="create-project__add-button">Add project</span>
                    <span onClick={this.cancel.bind(this)}
                          className="create-project__cancel">Cancel</span>
                </div>
            </div>
        )
    }
}

export default CreateProjectComponent;