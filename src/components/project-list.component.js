import * as React from 'react';
import ProjectItem from './project-item.component';
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {ProjectService} from "../services/project-service";
import {debounce} from "lodash";
import {LocalStorageService} from "../services/localStorage-service";

const projectService = new ProjectService();
const localStorageService = new LocalStorageService();
const pageSize = 50;

class ProjectList extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            selectedProject: {
                name: this.createNameForSelectedProject(),
                color: '#999999'
            },
            selectedTaskName: '',
            projectList: this.props.defaultProject === true ?
                [{
                    name: 'Last used project',
                    color: '#999999',
                    tasks: [],
                    id: getDefaultProjectEnums().LAST_USED_PROJECT
                }] :
                !this.props.workspaceSettings.forceProjects ?
                    [{name: 'No project', color: '#999999', tasks: []}] : [],
            page: 1,
            ready: false,
            loadMore: true,
            clients: ['Without client'],
            title: '',
            filter: '',
            isSpecialFilter: localStorageService.get('workspaceSettings') ?
                    JSON.parse(localStorageService.get('workspaceSettings')).projectPickerSpecialFilter : false
        };
        this.filterProjects = debounce(this.filterProjects, 500);
    }

    componentDidMount() {
        this.getProjects(this.state.page, pageSize);
    }

    getProjects(page, pageSize) {
        if (page === 0) {
            this.setState({
                projectList: !this.props.workspaceSettings.forceProjects ?
                    [{name: 'No project', color: '#999999', tasks: []}] : []
            })
        }
        if (!JSON.parse(localStorage.getItem('offline'))) {
            projectService.getProjectsWithFilter(this.state.filter, page, pageSize)
                .then(response => {
                    this.setState({
                        projectList: this.state.projectList.concat(response.data),
                        page: this.state.page + 1,
                        ready: true
                    }, () => {
                        this.setState({
                            clients: this.getClients(this.state.projectList),
                            loadMore: response.data.length === pageSize ? true : false
                        });

                        if(!this.state.isOpen) {
                            this.mapSelectedProject();
                        }
                    })

                })
                .catch(() => {
                });
        } else {
            this.setState({
                ready: true
            })
        }
    }

    mapSelectedProject() {

        const selectedProject = this.props.selectedProject === 'lastUsedProject' ?
            {
                name: 'Last used project',
                color: '#999999',
                tasks: [],
                id: getDefaultProjectEnums().LAST_USED_PROJECT
            } :
            this.state.projectList.filter(p => p.id === this.props.selectedProject)[0];


        if (this.props.selectedProject && selectedProject) {
            this.setState({
                selectedProject: selectedProject
            }, () => {
                this.setState({
                    title: this.createTitle()
                });
                const selectedTask = this.state.selectedProject.tasks ?
                    this.state.selectedProject.tasks.filter(
                        t => t.id === this.props.selectedTask)[0] : null;
                if (this.props.selectedTask && selectedTask) {
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
                const projectIds = [];
                projectIds.push(this.props.selectedProject);
                projectService.getProjectsByIds(projectIds).then(response => {
                    this.setState({
                        selectedProject: response.data[0]
                    }, () => {
                        this.setState({
                            title: this.createTitle()
                        });
                        const selectedTask = this.state.selectedProject.tasks ?
                            this.state.selectedProject.tasks.filter(
                                t => t.id === this.props.selectedTask)[0] : null;
                        if (selectedTask) {
                            this.setState({
                                selectedTaskName: selectedTask.name
                            }, () => {
                                this.setState({
                                    title: this.createTitle()
                                });
                            });
                        }
                    });
                });
            } else {
                this.setState({
                    selectedProject: {
                        name: this.props.defaultProject === true ?
                            'Select default project' : this.createNameForSelectedProject(),
                        color: '#999999'
                    }
                }, () => {
                    this.setState({
                        title: this.createTitle()
                    });
                });
            }
        }
    }

    getClients(projects) {
        const clients = new Set(projects.filter(p => p.client).map(p => p.client.name))

        return ['Without client', ...clients]
    }

    selectProject(project) {
        this.props.selectProject(project);

        this.setState({
                selectedProject: project,
                selectedTaskName: '',
                isOpen: false
            }, () => this.setState({
                title: this.createTitle()
            })
        );
    }

    selectTask(task, project) {
        this.props.selectTask(task.id, project);

        this.setState({
                selectedProject: project,
                selectedTaskName: task.name,
                isOpen: false
            }, () => this.setState({
                title: this.createTitle()
            })
        );
    }

    openProjectDropdown() {
        if (!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true
            }, () => {
                document.getElementById('project-filter').focus();
            });
        }
    }

    closeProjectList() {
        document.getElementById('project-dropdown').scroll(0, 0);
        this.setState({
            isOpen: false,
            projectList: !this.props.workspaceSettings.forceProjects ?
            [{name: 'No project', color: '#999999', tasks: []}] : [],
            page: 1,
            filter: ''
        }, () => {
            document.getElementById('project-filter').value = "";
            this.getProjects(this.state.page, pageSize);
        });
    }

    filterProjects() {
        this.setState({
            projectList: !this.props.workspaceSettings.forceProjects ?
                [{name: 'No project', color: '#999999', tasks: []}] : [],
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
        if (this.state.selectedProject.id) {
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
                name += 'and task ';
            }

            name += 'required)'
        }

        return name;
    }

    clearProjectFilter() {
        this.setState({
            projectList: !this.props.workspaceSettings.forceProjects ?
                [{name: 'No project', color: '#999999', tasks: []}] : [],
            filter: '',
            page: 1
        }, () => {
            this.getProjects(this.state.page, pageSize);
            document.getElementById('project-filter').value = null
        });
    }

    render() {
        if (!this.state.ready) {
            return null;
        } else {
            return (
                <div className="projects-list"
                     title={this.state.title}>
                    <div onClick={this.openProjectDropdown.bind(this)}
                         className={JSON.parse(localStorage.getItem('offline')) ?
                             "project-list-button-offline" : this.props.projectRequired || this.props.taskRequired ?
                                 "project-list-button-required" : "project-list-button"}>
                    <span style={{color: this.state.selectedProject.color}}
                          className="project-list-name">
                        {this.state.selectedProject.name}
                        <span className={this.state.selectedTaskName === "" ? "disabled" : ""}>
                            {" : " + this.state.selectedTaskName}
                        </span>
                    </span>
                        <span className="project-list-arrow">
                    </span>
                    </div>
                    <div className={this.state.isOpen ? "project-list-open" : "disabled"}>
                        <div onClick={this.closeProjectList.bind(this)} className="invisible"></div>
                        <div className="project-list-dropdown"
                             id="project-dropdown">
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
                                          onClick={this.clearProjectFilter.bind(this)}></span>
                                </div>
                            </div>
                            {
                                this.state.clients.map(client => {
                                    return (
                                        <div>
                                            <div className="project-list-client">{client}</div>
                                            {
                                                this.state.projectList
                                                    .filter(project =>
                                                        (project.client && project.client.name === client) ||
                                                        (!project.client && client === 'Without client'))
                                                    .map(project => {
                                                        return (
                                                            <a>
                                                                <ProjectItem
                                                                    project={project}
                                                                    noTasks={this.props.noTasks}
                                                                    selectProject={this.selectProject.bind(this)}
                                                                    selectTask={this.selectTask.bind(this)}
                                                                    workspaceSettings={this.props.workspaceSettings}
                                                                />
                                                            </a>
                                                        )
                                                    })
                                            }
                                        </div>
                                    )
                                })
                            }
                            <div className={this.state.loadMore ? "project-list-load" : "disabled"}
                                 onClick={this.loadMoreProjects.bind(this)}>Load more
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    }
}

export default ProjectList;
