import * as React from "react";
import ProjectList from "./project-list.component";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {ProjectHelper} from "../helpers/project-helper";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";

const projectHelper = new ProjectHelper();
const localStorageService = new LocalStorageService();

class DefaultProject extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            defaultProjectEnabled: false,
            defaultProjectForUserOnWorkspace: projectHelper.getDefaultProjectOfWorkspaceForUser()
        };
    }

    componentDidMount() {
        this.isDefaultProjectEnabled();
        this.getDefaultProjectOfWorkspaceForUser();
    }

    isDefaultProjectEnabled() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        let defaultProjectsFromStorage = projectHelper.getDefaultProjectListFromStorage();
        const defProjectByUserAndActiveWorkspaceId =
            projectHelper.filterProjectsByWorkspaceAndUser(defaultProjectsFromStorage, activeWorkspaceId, userId);

        if (!defProjectByUserAndActiveWorkspaceId) {
            return;
        }

        this.setState({
            defaultProjectEnabled: defProjectByUserAndActiveWorkspaceId.enabled
        }, () => {
            setTimeout(() => {
                if (defProjectByUserAndActiveWorkspaceId.enabled) {
                    document.getElementById('defaultProject').style.padding = "20px 20px";
                    document.getElementById('defaultProject').style.maxHeight = '360px';
                }
            },220);
        });
    }

    toggleDefaultProjectEnabled() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        let defaultProjectsFromStorage = projectHelper.getDefaultProjectListFromStorage();
        const defProjectByUserAndActiveWorkspaceId =
            projectHelper.filterProjectsByWorkspaceAndUser(defaultProjectsFromStorage, activeWorkspaceId, userId);
        const defaultProjectElem = document.getElementById('defaultProject');

        if (!defProjectByUserAndActiveWorkspaceId) {
            this.setInitialDefaultProject(activeWorkspaceId, userId, defaultProjectsFromStorage);
            defaultProjectElem.style.padding = "20px 20px";
            defaultProjectElem.style.maxHeight = '360px';
        } else {
            defaultProjectsFromStorage = defaultProjectsFromStorage.map(defProject => {
                if (defProject.userId === userId && defProject.workspaceId === activeWorkspaceId) {
                    defProject.enabled = !this.state.defaultProjectEnabled;

                    if (defProject.enabled) {
                        defaultProjectElem.style.padding = "20px 20px";
                        defaultProjectElem.style.maxHeight = '360px';
                    } else {
                        defaultProjectElem.style.padding = '0 20px';
                        defaultProjectElem.style.maxHeight = "0";
                    }
                }

                return defProject;
            });

            projectHelper.setDefaultProjectsToStorage(defaultProjectsFromStorage);
        }

        this.setState({
            defaultProjectEnabled: !this.state.defaultProjectEnabled,
            defaultProjectForUserOnWorkspace: projectHelper.getDefaultProjectOfWorkspaceForUser()
        }, () => {
            this.projectList.setState({
                isOpen: false
            });
            this.projectList.mapSelectedProject()
        });
        this.props.changeSaved();
    }

    setInitialDefaultProject(activeWorkspaceId, userId, defaultProjects) {
        let initialProject = {};
        initialProject.id = getDefaultProjectEnums().LAST_USED_PROJECT;
        const createdDefaultProject = {
            workspaceId: activeWorkspaceId,
            userId: userId,
            project: initialProject,
            enabled: true
        };

        defaultProjects.push(createdDefaultProject);
        projectHelper.setDefaultProjectsToStorage(defaultProjects);
    }

    setDefaultProject(defaultProject) {
        projectHelper.setDefaultProject(defaultProject)
        this.props.changeSaved();
    }

    getDefaultProjectOfWorkspaceForUser() {
        this.setState({
            defaultProjectForUserOnWorkspace: projectHelper.getDefaultProjectOfWorkspaceForUser()
        })
    }

    projectListOpened() {
        this.setState({
            defaultProjectEnabled: true
        });
    }

    render() {
        console.log(this.state.defaultProjectForUserOnWorkspace)
        return (
            <div>
                <div className="default-project"
                     onClick={this.toggleDefaultProjectEnabled.bind(this)}>
                    <span className={this.state.defaultProjectEnabled ?
                        "default-project-checkbox checked" : "default-project-checkbox"}>
                        <img src="./assets/images/checked.png"
                             className={this.state.defaultProjectEnabled ?
                                 "default-project-checkbox--img" :
                                 "default-project-checkbox--img_hidden"}/>
                    </span>
                    <span className="default-project-title">Default project</span>
                </div>
                <div id="defaultProject"
                     className="default-project__project-list expandContainer">
                    <ProjectList
                        ref={instance => {
                            this.projectList = instance
                        }}
                        selectedProject={this.state.defaultProjectEnabled && this.state.defaultProjectForUserOnWorkspace ?
                            this.state.defaultProjectForUserOnWorkspace.id : null}
                        selectProject={this.setDefaultProject.bind(this)}
                        noTasks={true}
                        defaultProject={true}
                        workspaceSettings={this.props.workspaceSettings}
                        projectListOpened={this.projectListOpened.bind(this)}
                    />
                </div>
            </div>
        )
    }
}

export default DefaultProject;