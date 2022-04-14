import * as React from "react";
import DefaultProjectList from "./default-project-list.component";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {DefaultProject} from '../helpers/storageUserWorkspace';

const _isPomodoro = true;

class DefaultPomodoroBreakProject extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            selectedProject: null
        };
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
    }

    async setAsyncStateItems() {
        let { storage, defaultProject } = await DefaultProject.getStorage(_isPomodoro); 
        if (!defaultProject) {
            defaultProject = storage.setInitialDefaultProject();
        }
        this.setState({
            selectedProject: defaultProject ? defaultProject.project : null
        });
    }

    componentDidMount() {
        this.onMountOrUpdate();
        this.setAsyncStateItems();
        // pomodoro is at User level, so when we create a new WS, we inherit settings from previous WS
    }

    onMountOrUpdate() {
        const elem = document.getElementById('defaultProjectPomodoro');
        elem.style.maxHeight = '360px';
        this.props.resizeHeight();
    }

    componentDidUpdate(prevProps, prevState) {
    }

    async setDefaultProject(project) {
        const { storage } = await DefaultProject.getStorage(_isPomodoro);
        storage.setDefaultProject(project);

        this.setState({
            selectedProject: project
        }, () => {
            this.onMountOrUpdate();
        });

        this.props.changeSaved();
    }

    projectListOpened() {
        this.props.resizeHeight(true);
    }

    render() {
        const { selectedProject } = this.state;
        return (
            <div style={{padding: "0px 20px 50px 20px"}}>
                <div id="defaultProjectPomodoro"
                     className="default-project__project-list expandContainer ">
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
                        isPomodoro={true}
                    />
                </div>
            </div>
        )
    }
}

export default DefaultPomodoroBreakProject;