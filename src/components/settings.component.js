import * as React from 'react';
import HomePage from './home-page.component';
import * as ReactDOM from 'react-dom';
import ProjectList from "./project-list.component";
import {getBrowser} from "../helpers/browser-helpers";
import {isAppTypeDesktop, isAppTypeExtension} from "../helpers/app-types-helpers";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {ProjectHelpers} from "../helpers/project-helpers";
import Header from "./header.component";
import WorkspaceList from "./workspace-list.component";
import {UserService} from "../services/user-service";

const projectHelpers = new ProjectHelpers();
const userService = new UserService();

class Settings extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            userEmail: '',
            userPicture: null,
            defaultProject: null,
            defaultProjectEnabled: false
        };

        this.toggleDefaultProjectEnabled = this.toggleDefaultProjectEnabled.bind(this);
    }

    componentDidMount(){
        this.getUserSettings();
        this.updateDefaultProjectEnabled(this.getDefaultProject());
    }

    selectWorkspace(workspaceId) {
        userService.setDefaultWorkspace(workspaceId)
            .then(response => {
                localStorage.setItem('activeWorkspaceId', workspaceId);
                if (isAppTypeExtension()) {
                    getBrowser().storage.sync.set({
                        activeWorkspaceId: (workspaceId)
                    });
                }
                this.setState({
                    defaultProjectEnabled: false
                });
                this.updateDefaultProjectEnabled(this.getDefaultProject());
            })
            .catch(() => {
            });
    }

    getUserSettings() {
        const userId = localStorage.getItem('userId');
        userService.getUser(userId)
            .then(response => {
                let data = response.data;
                this.setState({
                    userEmail: data.email,
                    userPicture: data.profilePicture
                })
            })
    }

    saveSettings() {
        ReactDOM.render(<HomePage/>, document.getElementById('mount'))
    }

    setDefaultProject(defaultProject) {
        const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const defaultProjects = projectHelpers.getDefaultProjectListFromStorage();
        const defaultProjectForWorkspace = this.getDefaultProject();

        if (defaultProjectForWorkspace) {
            const index = defaultProjects.findIndex(
                (defaultProject) => defaultProject.project.id === defaultProjectForWorkspace.id);
            defaultProjects[index].project = defaultProject;
        } else {
            defaultProjects.push(this.createDefaultProject(activeWorkspaceId, defaultProject));
        }

        localStorage.setItem(
            getDefaultProjectEnums().DEFAULT_PROJECTS,
            JSON.stringify(defaultProjects)
        );
    }

    getDefaultProject() {
        const defaultProjects = projectHelpers.getDefaultProjectListFromStorage();
        const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');

        const defProject =
            projectHelpers.filterProjectsByWorkspace(defaultProjects, activeWorkspaceId);

        return defProject && defProject.project && defProject.project.id ?
                    defProject.project : null;
    }

    updateDefaultProjectEnabled(project) {
        this.setState({defaultProjectEnabled: project  ? true : false})

    }

    toggleDefaultProjectEnabled() {
        const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
        const defaultProjectEnabledNewValue = !this.state.defaultProjectEnabled;

        this.setState({
            defaultProjectEnabled: defaultProjectEnabledNewValue
        });

        if (defaultProjectEnabledNewValue) {
            this.setInitialDefaultProject(activeWorkspaceId);
        } else {
            projectHelpers.clearDefaultProjectForWorkspace(activeWorkspaceId);
        }
    }

    setInitialDefaultProject(activeWorkspaceId) {
        const defaultProjects = projectHelpers.getDefaultProjectListFromStorage();
        let initialProject = {};
        initialProject.id = getDefaultProjectEnums().LAST_USED_PROJECT;
        const createdDefaultProject = this.createDefaultProject(
            activeWorkspaceId,
            initialProject
        );

        defaultProjects.push(createdDefaultProject);
        projectHelpers.setDefaultProjectsToStorage(defaultProjects);
    }

    createDefaultProject(activeWorkspaceId, project) {
        return {
            project: project,
            workspaceId: activeWorkspaceId
        };
    }

    render(){
        let version;
        if (isAppTypeDesktop()) {
            version =
                <div className="app-version">Version: {localStorage.getItem('appVersion')}</div>
        }

        if(!this.state.userPicture) {
            return null;
        } else {
            return(
                <div>
                    <Header
                        showActions={false}
                    />
                    <div className="user-settings">
                        <span><img src={this.state.userPicture}/></span>
                        <span>{this.state.userEmail}</span>
                    </div>
                    <WorkspaceList
                        selectWorkspace={this.selectWorkspace.bind(this)}
                    />
                    <div className="settings-default-project">
                        <span className="settings-default-project-checkbox"
                              onClick={this.toggleDefaultProjectEnabled}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.defaultProjectEnabled ?
                                     "settings-default-project-checkbox--img" :
                                     "settings-default-project-checkbox--img_hidden"}/>
                        </span>
                        <span className="settings-project-title">Default project</span>
                        {this.state.defaultProjectEnabled &&
                            <div className="settings-default-project__project-list">
                                <ProjectList
                                    ref={instance => {
                                        this.projectList = instance
                                    }}
                                    selectedProject={this.state.defaultProjectEnabled ?
                                        this.getDefaultProject().id : null}
                                    selectProject={this.setDefaultProject.bind(this)}
                                    noTasks={true}
                                    defaultProject={true}
                                    workspaceSettings={this.props.workspaceSettings}
                                />
                            </div>
                        }
                    </div>
                    <div className="settings-buttons">
                        <button onClick={this.saveSettings.bind(this)} className="settings-button-save">DONE</button>
                    </div>
                    { version}
                </div>
            )
        }
    }
}

export default Settings;