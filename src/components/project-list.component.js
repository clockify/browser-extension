import * as React from 'react';
import ProjectItem from './project-item.component';
import {ProjectService} from "../services/project-service";
import {debounce} from "lodash";
import {LocalStorageService} from "../services/localStorage-service";
import * as ReactDOM from "react-dom";
import CreateProjectComponent from "./create-project.component";
import { ProjectHelper } from '../helpers/project-helper';

const projectService = new ProjectService();
const localStorageService = new LocalStorageService();
const pageSize = 50;
const projectHelper = new ProjectHelper()

class ProjectList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            selectedProject: {
                name: this.createNameForSelectedProject(),
                color: this.getColorForProject()
            },
            selectedTaskName: '',
            projectList:!this.props.workspaceSettings.forceProjects && this.props.selectedProject ?
                    [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}] : [],
            page: 1,
            loadMore: true,
            clients: ['Without client'],
            title: '',
            filter: '',
            isSpecialFilter: localStorageService.get('workspaceSettings') ?
                JSON.parse(localStorageService.get('workspaceSettings')).projectPickerSpecialFilter : false,
            isEnabledCreateProject: false,
            specFilterNoTasksOrProject: ""
        };
        this.filterProjects = debounce(this.filterProjects, 500);
        this.openProjectDropdown = this.openProjectDropdown.bind(this);
        this.mapSelectedProject = this.mapSelectedProject.bind(this);
        this.mapSelectedTask = this.mapSelectedTask.bind(this);
        this.createProject = this.createProject.bind(this);
        this.clearProjectFilter = this.clearProjectFilter.bind(this);
    }

    componentDidMount() {
        this.setState({
            isEnabledCreateProject: !this.props.workspaceSettings.onlyAdminsCreateProject ||
                this.props.isUserOwnerOrAdmin ? true : false
        });

        if (this.props.selectedProject) {
            this.setState({
                selectedProject: {
                    name: this.props.selectedProject.name
                },
                selectedTaskName: this.props.selectedTask ? this.props.selectedTask.name : ""
            })
        }
    }

    isOpened() {
        return this.state.isOpen;
    }

    closeOpened() {
        this.setState({
            isOpen: false
        });
    }

    getProjects(page, pageSize) {
        if (!JSON.parse(localStorage.getItem('offline'))) {
            projectService.getProjectsWithFilter(this.state.filter, page, pageSize)
                .then(response => {
                    const projects = this.props.forceTasks
                        ? response.data.filter(project => project.taskCount > 0)
                        : response.data;
                    const projectList = this.state.projectList.concat(projects);
                    this.setState({
                        projectList: this.state.filter.length > 0
                            ? projectList.filter(project => project.name !== "No project")
                            : projectList,
                        page: this.state.page + 1,
                    }, () => {
                        this.setState({
                            clients: this.getClients(this.state.projectList),
                            loadMore: response.data.length === pageSize ? true : false,
                            specFilterNoTasksOrProject: 
                                projectHelper.createMessageForNoTaskOrProject(
                                    projects, this.state.isSpecialFilter, this.state.filter
                                )
                        });
                    });
                })
                .catch(() => {
                });
        }
        else {
        }
    }

    getProjectTasks(projectId, filter, page) {
        return projectService.getProjectTasksWithFilter(projectId, filter, page);
    }
    
    mapSelectedProject() {
        const selectedProject = this.props.selectedProject
            ? this.state.projectList.filter(p => p.id === this.props.selectedProject.id)[0]
            : null;

        if (this.props.selectedProject && selectedProject) {
            this.setState({
                selectedProject: selectedProject
            }, () => {
                this.setState({
                    title: this.createTitle()
                });
                const selectedTask = this.state.selectedProject.tasks && this.props.selectedTask 
                    ? this.state.selectedProject.tasks.filter(t => t.id === this.props.selectedTask.id)[0]
                    : null;
                if (selectedTask) {
                    this.setState({
                        selectedTaskName: selectedTask.name
                    }, () => {
                        this.setState({
                            title: this.createTitle()
                        });
                    });
                }
            })
        } else {
            if (this.props.selectedProject) {
                projectService.getProjectsByIds([this.props.selectedProject.id])
                    .then(response => {
                        if (response.data.length > 0 && !response.data[0].archived) {
                            this.setState({
                                selectedProject: response.data[0]
                            }, () => {
                                this.setState({
                                    title: this.createTitle()
                                });
                                if (this.props.selectedTask) {
                                    projectService.getAllTasks([this.props.selectedTask.id])
                                        .then(response => {
                                            const selectedTask = response.data[0];
                                            if (selectedTask) {
                                                this.setState({
                                                    selectedTaskName: selectedTask.name
                                                }, () => {
                                                    this.setState({
                                                        title: this.createTitle()
                                                    });
                                                });
                                            }            
                                        })
                                        .catch(error => {
                                        })
                                }             
                            });
                        }
                    });
            } 
            else {
                this.setState({
                    selectedProject: {
                        name: this.createNameForSelectedProject(),
                        color: this.getColorForProject()
                    }
                }, () => {
                    this.setState({
                        title: this.createTitle()
                    });
                });
            }
        }
    }

    mapSelectedTask(selectedTaskName) {
        if (this.state.selectedProject && this.state.selectedTaskName !== selectedTaskName) {
            this.setState({
                selectedTaskName
            })
        }
    }


    getClients(projects) {
        const clients = new Set(projects.filter(p => p.client).map(p => p.client.name))
        if (projects && projects.length > 0) {
            return ['Without client', ...clients]
        } else {
            return []
        }
    }

    selectProject(project) {
        this.props.selectProject(project);
        let projectList;
        if (project.id && !this.props.forceProjects) {
            if (this.state.projectList.filter(project => project.name === "No project").length == 0) {
                projectList = 
                    [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}, ...this.state.projectList]
            } else {
                projectList = this.state.projectList
            }
        } else {
            projectList = this.state.projectList.filter(project => project.name !== "No project")
        }

        this.setState({
                selectedProject: project,
                selectedTaskName: '',
                isOpen: false,
                projectList: projectList
            }, () => this.setState({
                title: this.createTitle()
            })
        );
    }

    selectTask(task, project) {
        this.props.selectTask(task, project);

        this.setState({
                selectedProject: project,
                selectedTaskName: task.name,
                isOpen: false
            }, () => this.setState({
                title: this.createTitle()
            })
        );
    }

    openProjectDropdown(e) {
        e.stopPropagation();
        if (!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true,
                filter: '',
                page: 1,
                projectList: !this.props.workspaceSettings.forceProjects && this.props.selectedProject 
                    ? [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}]
                    : []
            }, () => {
                document.getElementById('project-filter').value = null;
                document.getElementById('project-filter').focus();
                this.getProjects(this.state.page, pageSize, this.state.isEnabledCreateProject);
                this.props.projectListOpened();
            });
        }
    }

    closeProjectList() {
        document.getElementById('project-dropdown').scroll(0, 0);
        this.setState({
            isOpen: false,
            filter: ''
        }, () => {
        });
    }

    filterProjects() {
        this.setState({
            projectList: !this.props.workspaceSettings.forceProjects && this.props.selectedProject ?
                [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}] : [],
            filter: document.getElementById('project-filter').value.toLowerCase(),
            page: 1
        }, () => {
            this.getProjects(this.state.page, pageSize);
        });
    }

    loadMoreProjects() {
        this.getProjects(this.state.page, pageSize);
    }


    createTitle() {
        let title = 'Add project';
        if (this.state.selectedProject && this.state.selectedProject.id) {
            title = 'Project: ' + this.state.selectedProject.name;

            if (this.state.selectedTaskName) {
                title = title + '\nTask: ' + this.state.selectedTaskName;
            }

            if (this.state.selectedProject.client && this.state.selectedProject.client.name) {
                title = title + '\nClient: ' + this.state.selectedProject.client.name;
            }
        }

        return title;
    }

    createNameForSelectedProject() {
        let name = 'Add project';
        if (this.props.projectRequired) {
            name += ' (project ';
            if (this.props.taskRequired) {
                name = 'Add task (';
            }
            name += 'required)'
        }
        return name;
    }

    clearProjectFilter() {
        this.setState({
            projectList: !this.props.workspaceSettings.forceProjects && this.props.selectedProject
                ? [{name: 'No project', id: 'no-project', color: '#999999', tasks: []}]
                : [],
            filter: '',
            page: 1
        }, () => {
            this.getProjects(this.state.page, pageSize);
            document.getElementById('project-filter').value = null
        });
    }

    getColorForProject() {
        const userId = localStorageService.get('userId');
        const darkModeFromStorage = localStorageService.get('darkMode') ?
            JSON.parse(localStorageService.get('darkMode')) : [];

        if (darkModeFromStorage.length > 0 &&
            darkModeFromStorage.filter(darkMode => darkMode.userId === userId && darkMode.enabled).length > 0
        ) {
            return '#90A4AE';
        } else {
            return '#999999';
        }
    }

    createProject() {
        ReactDOM.render(<CreateProjectComponent
            timeEntry={this.props.timeEntry}
            editForm={this.props.editForm}
            workspaceSettings={this.props.workspaceSettings}
            timeFormat={this.props.timeFormat}
            isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
            userSettings={this.props.userSettings}
            projectName={this.state.filter} 
        />, document.getElementById('mount'));
    }

    render() {
        return (
            <div className="projects-list"
                    title={this.state.title}>
                <div 
                    onClick={this.openProjectDropdown}
                    tabIndex={"0"} 
                    onKeyDown={e => {if (e.key==='Enter') this.openProjectDropdown(e)}}
                    className={JSON.parse(localStorage.getItem('offline')) ?
                            "project-list-button-offline" : this.props.projectRequired || this.props.taskRequired ?
                                "project-list-button-required" : "project-list-button"}>
                    <span style={{color: this.state.selectedProject ? this.state.selectedProject.color : "#999999"}}
                            className="project-list-name">
                        {this.state.selectedProject ? this.state.selectedProject.name : "Add project"}
                        <span className={this.state.selectedTaskName === "" ? "disabled" : ""}>
                            {" : " + this.state.selectedTaskName}
                        </span>
                    </span>
                    <span className={this.state.isOpen ? 'project-list-arrow-up' : 'project-list-arrow'} >
                    </span>
                </div>
                {this.props.taskRequired && 
                    <div className='error'>Can't save without task</div>
                }

                {this.state.isOpen &&
                    <div className="project-list-open">
                    <div onClick={this.closeProjectList.bind(this)} className="invisible"></div>
                    <div className="project-list-dropdown"
                            id="project-dropdown">
                        <div className="project-list-dropdown--content">
                            <div className="project-list-input">
                                <div className="project-list-input--border">
                                    <input
                                        placeholder={
                                            this.state.isSpecialFilter ?
                                                "Filter task @project or client" : "Filter projects"
                                        }
                                        className="project-list-filter"
                                        onChange={this.filterProjects.bind(this)}
                                        id="project-filter"
                                    />
                                    <span className={!!this.state.filter ? "project-list-filter__clear" : "disabled"}
                                            onClick={this.clearProjectFilter}></span>
                                </div>
                            </div>
                            {
                                this.state.clients.map(client => {
                                    return (
                                        <div key={client}>
                                            <div className="project-list-client">{client}</div>
                                            {
                                                this.state.projectList
                                                    .filter(project =>
                                                        (project.client && project.client.name === client) ||
                                                        (!project.client && client === 'Without client'))
                                                    .map(project => {
                                                        return (
                                                            <ProjectItem
                                                                key={project.id}
                                                                project={project}
                                                                noTasks={this.props.noTasks}
                                                                selectProject={this.selectProject.bind(this)}
                                                                selectTask={this.selectTask.bind(this)}
                                                                workspaceSettings={this.props.workspaceSettings}
                                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                                                getProjectTasks={this.getProjectTasks}
                                                            />
                                                        )
                                                    })
                                            }
                                        </div>
                                    )
                                })
                            }
                            <div className={this.state.specFilterNoTasksOrProject.length > 0 ? "project-list__spec_filter_no_task_or_project" : "disabled"}>
                                <span>{this.state.specFilterNoTasksOrProject}</span>
                            </div>
                            <div className={this.state.loadMore ? "project-list-load" : "disabled"}
                                    onClick={this.loadMoreProjects.bind(this)}>Load more
                            </div>
                            <div className={this.state.isEnabledCreateProject ?
                                    "projects-list__bottom-padding" : "disabled"}>
                            </div>
                            <div className={this.state.isEnabledCreateProject ?
                                    "projects-list__create-project" : "disabled"}
                                    onClick={this.createProject}>
                                <span className="projects-list__create-project--icon"></span>
                                <span className="projects-list__create-project--text">Create new project</span>
                            </div>
                        </div>
                    </div>
                </div>
                }
                </div>
        )
    }
}

export default ProjectList;