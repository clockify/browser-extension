import * as React from "react";
import DefaultProjectList from "./default-project-list.component";
import {getDefaultProjectEnums} from "../enums/default-project.enum";

import {DefaultProject} from '../helpers/storageUserWorkspace';

class DefaultProjectComponent extends React.Component {
    constructor(props) {
        super(props);

        const { storage, defaultProject } = DefaultProject.getStorage();
        this.state = {
            defaultProjectEnabled: defaultProject ? defaultProject.enabled : false,
            selectedProject: defaultProject ? defaultProject.project : null
        };
    }

    componentDidMount() {
        this.onMountOrUpdate();
    }

    onMountOrUpdate() {
        const elem = document.getElementById('defaultProject');
        if (this.state.defaultProjectEnabled) {
            elem.style.padding = "10px 20px";
            elem.style.maxHeight = '360px';
        }  
        else {
            elem.style.padding = '0 20px';
            elem.style.maxHeight = "0";
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.defaultProjectEnabled !== this.state.defaultProjectEnabled) {
            const { storage, defaultProject } = DefaultProject.getStorage();
            this.setState({
                defaultProjectEnabled: defaultProject ? defaultProject.enabled : false,
                selectedProject: defaultProject ? defaultProject.project : null
            }, () => {
                this.onMountOrUpdate();
            });
        }
    }

    toggleDefaultProjectEnabled() {
        let { storage, defaultProject } = DefaultProject.getStorage();
        if (!defaultProject) {
            defaultProject = storage.setInitialDefaultProject();
        } 
        else {
            storage.toggleEnabledOfDefaultProject();
        }

        this.setState({
            defaultProjectEnabled: !this.state.defaultProjectEnabled,
            selectedProject: defaultProject ? defaultProject.project : null
        }, () => {
            this.projectList.closeOpened();
            this.props.changeSaved();
        });
    }


    setDefaultProject(project) {
        const { storage } = DefaultProject.getStorage();
        storage.setDefaultProject(project);

        this.setState({
            selectedProject: project
        }, () => {
            this.onMountOrUpdate();
        });

        this.props.changeSaved();
    }

    projectListOpened() {
        this.setState({
            defaultProjectEnabled: true
        });
    }

    render() {
        const { defaultProjectEnabled, selectedProject } = this.state;
        const {forceProjects, forceTasks} = this.props.workspaceSettings;
        const name = forceTasks ? 'Default project and task' : 'Default project';

        return (
            <div>
                <div className="default-project"
                     onClick={this.toggleDefaultProjectEnabled.bind(this)}>
                    <span className={defaultProjectEnabled ?
                        "default-project-checkbox checked" : "default-project-checkbox"}>
                        <img src="./assets/images/checked.png"
                             className={defaultProjectEnabled ?
                                 "default-project-checkbox--img" :
                                 "default-project-checkbox--img_hidden"}/>
                    </span>
                    <span className="default-project-title">{name}</span>
                </div>
                <div id="defaultProject"
                    className="default-project__project-list expandContainer">
                    <DefaultProjectList
                        ref={instance => {
                            this.projectList = instance
                        }}
                        selectedProject={selectedProject}
                        selectProject={this.setDefaultProject.bind(this)}
                        workspaceSettings={this.props.workspaceSettings}
                        projectListOpened={this.projectListOpened.bind(this)}
                        isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                        noTask={false}
                        isPomodoro={false}
                    />
                </div>
            </div>
        )
    }
}

export default DefaultProjectComponent;