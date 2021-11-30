import * as React from 'react';
import ProjectItem from './project-item.component';
import {ProjectService} from "../services/project-service";
import {debounce, reduce} from "lodash";
import {LocalStorageService} from "../services/localStorage-service";
import * as ReactDOM from "react-dom";
import CreateProjectComponent from "./create-project.component";
import { offlineStorage } from '../helpers/offlineStorage';

const projectService = new ProjectService();
const localStorageService = new LocalStorageService();
const pageSize = 50;

const _noProjectObj = { 
    id: 'no-project',
    name: 'No project',
    client: { 
        name: 'NO-PROJECT'
    },
    color: '#999999', 
    tasks: []
}

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
            projectList: this.initialProjectList,
            page: 1,
            loadMore: true,
            clientProjects: {},
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
        this.forceProjects = this.props.workspaceSettings.forceProjects;
    }

    get initialProjectList() {
        const { selectedProject} = this.props;
        return !this.forceProjects && selectedProject && selectedProject.id !== 'no-project'
            ? [_noProjectObj]
            : []
    }

    createDemoProjects() {
        for (let i=100; i <= 300; i++) {
            const project = {
                name: 'p' + i,
                clientId: null,
                color: "#3F51B5",
                billable: i%3 === 0 ? true : false,
                isPublic: i%2 === 0 ? true : false
            }

            projectService.createProject(project)
                .then(response => {
                    if (i%2 === 0) {
                        for (var j=1; j <= 5; j++)
                            projectService.createTestTask({ 
                                projectId: response.data.id,
                                name: 'Task' + j
                            })
                    }

                })
                .catch(error => {
                    console.log('error', error.response.data.message);
                });
        }
    }

    componentDidMount() {
        this.setState({
            isEnabledCreateProject: !this.props.workspaceSettings.onlyAdminsCreateProject ||
                this.props.isUserOwnerOrAdmin ? true : false
        });

        if (this.props.selectedProject) {
            this.setState({
                selectedProject: {
                    name: this.props.selectedProject.name,
                    color: this.props.selectedProject.color
                },
                selectedTaskName: this.props.selectedTask ? this.props.selectedTask.name : ""
            })
        }

        setTimeout(()=> {
           // this.createDemoProjects();
        })

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
            const {forceTasks} = this.props;
            const already = this.state.projectList.map(p => p.id);
            projectService.getProjectsWithFilter(this.state.filter, page, pageSize, forceTasks, already)
                .then(response => {
                    const projects = response.data;
                    const projectList = this.state.projectList.concat(projects);
                    this.setState({
                        projectList: this.state.filter.length > 0
                            ? projectList.filter(project => project.id !== "no-project")
                            : projectList.length > 0
                                ? projectList
                                : this.forceProjects
                                    ? []
                                    : [_noProjectObj],
                        page: this.state.page + 1
                    }, () => {
                        this.setState({
                            clientProjects: this.getClients(this.state.projectList),
                            loadMore: response.data.length >= pageSize ? true : false,
                            specFilterNoTasksOrProject: 
                                this.createMessageForNoTaskOrProject(
                                    projects, this.state.isSpecialFilter, this.state.filter)
                        });
                    });
                })
                .catch(() => {
                });
        }
        else {
        }
    }

    createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
        if (!isSpecialFilter || filter.length === 0 || projects.length > 0) return ""
        
        if (!filter.includes("@")) {
            return "No matching tasks. Search projects with @project syntax"
        } else {
            return "No matching projects"
        }
    }

    getProjectTasks(projectId, filter, page) {
        return projectService.getProjectTasksWithFilter(projectId, filter, page);
    }

    
    makeProjectFavorite(projectId) {
        return projectService.makeProjectFavorite(projectId);
    }
    removeProjectAsFavorite(projectId) {
        return projectService.removeProjectAsFavorite(projectId);
    }
    
    mapSelectedProject() {
        const selectedProject = this.props.selectedProject
            ? this.state.projectList.find(p => p.id === this.props.selectedProject.id)
            : null;

        if (this.props.selectedProject && selectedProject) {
            this.setState({
                selectedProject: selectedProject
            }, () => {

                if (offlineStorage.userHasCustomFieldsFeature) {
                    this.props.onChangeProjectRedrawCustomFields();
                }

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
                                if (offlineStorage.userHasCustomFieldsFeature) {
                                    this.props.onChangeProjectRedrawCustomFields()
                                }
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


    groupByClientName(objectArray) {
        return objectArray.reduce((acc, p) => {
            const key = p.client && !!p.client.name
                ? p.client.name
                : 'WITHOUT-CLIENT';
            if (!acc[key]) {
                acc[key] = [];
            }
            // Add object to list for given key's value
            acc[key].push(p);
            return acc;
        }, {});
    }

    getClients(projects) {
        const { projectFavorites } = this.props.workspaceSettings;
        if (projectFavorites) {
            const clientProjects = this.groupByClientName(projects.filter(p => !p.favorite));
            const favorites = projects.filter(p => p.favorite);
            if (favorites.length > 0) {
                clientProjects['FAVORITES'] = favorites;
            }
            return clientProjects;
        }
        else {
            const clientProjects = this.groupByClientName(projects);
            return clientProjects;   
        }
    }

    selectProject(project) {
        this.props.selectProject(project);
        let projectList;
        if (project.id && !this.forceProjects) {
            if (this.state.projectList.find(project => project.id === "no-project")) {
                projectList = [_noProjectObj, ...this.state.projectList]
            } else {
                projectList = this.state.projectList
            }
        } else {
            projectList = this.state.projectList.filter(project => project.id !== "no-project")
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
                projectList: this.initialProjectList
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
            filter: '',
            clientProjects: {}
        }, () => {
        });
    }

    filterProjects() {
        this.setState({
            projectList: this.initialProjectList,
            filter: document.getElementById('project-filter').value.toLowerCase(),
            page: 1,
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
            projectList: this.initialProjectList,
            filter: '',
            page: 1,
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
        const { clientProjects } = this.state;
        const sortedClients = Object.keys(clientProjects).sort();
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
                    <span className="project-list-name" style={{color: this.state.selectedProject ? this.state.selectedProject.color : "#333"}}>
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
                            { clientProjects['NO-PROJECT'] && clientProjects['NO-PROJECT'].length > 0 &&
                                <div>
                                    {clientProjects['NO-PROJECT'].map(project =>
                                        <ProjectItem
                                            key={project.id}
                                            project={project}
                                            noTasks={this.props.noTasks}
                                            selectProject={this.selectProject.bind(this)}
                                            selectTask={this.selectTask.bind(this)}
                                            workspaceSettings={this.props.workspaceSettings}
                                            isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                            getProjectTasks={this.getProjectTasks}
                                            projectFavorites={false}
                                        />
                                    )}
                                </div>
                            }

                            { clientProjects['FAVORITES'] && clientProjects['FAVORITES'].length > 0 &&
                                <div>
                                    <div className="project-list-client"><i>FAVORITES</i></div>
                                    {clientProjects['FAVORITES'].map(project => 
                                        <div key={project.id}>
                                            <ProjectItem
                                                key={project.id}
                                                project={project}
                                                noTasks={this.props.noTasks}
                                                selectProject={this.selectProject.bind(this)}
                                                selectTask={this.selectTask.bind(this)}
                                                workspaceSettings={this.props.workspaceSettings}
                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                                getProjectTasks={this.getProjectTasks}
                                                makeProjectFavorite={this.makeProjectFavorite}
                                                removeProjectAsFavorite={this.removeProjectAsFavorite}
                                                projectFavorites={this.props.workspaceSettings.projectFavorites}
                                            />
                                        </div>                            
                                    )}
                                </div>
                            }

                            { clientProjects['WITHOUT-CLIENT'] && clientProjects['WITHOUT-CLIENT'].length > 0 &&
                                <div>
                                    <div className="project-list-client"><i>Without client</i></div>
                                    {clientProjects['WITHOUT-CLIENT'].map(project => 
                                        <div key={project.id}>
                                            <ProjectItem
                                                key={project.id}
                                                project={project}
                                                noTasks={this.props.noTasks}
                                                selectProject={this.selectProject.bind(this)}
                                                selectTask={this.selectTask.bind(this)}
                                                workspaceSettings={this.props.workspaceSettings}
                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                                getProjectTasks={this.getProjectTasks}
                                                makeProjectFavorite={this.makeProjectFavorite}
                                                removeProjectAsFavorite={this.removeProjectAsFavorite}
                                                projectFavorites={this.props.workspaceSettings.projectFavorites}
                                            />
                                        </div>                            
                                    )}
                                </div>
                            }
                            <div>
                                {sortedClients.filter(client => !['FAVORITES', 'NO-PROJECT', 'WITHOUT-CLIENT'].includes(client)).map(client => 
                                    <div key={client}>
                                        <div className="project-list-client"><i>{client}</i></div>
                                        {clientProjects[client].map(project => 
                                            <ProjectItem
                                                key={project.id}
                                                project={project}
                                                noTasks={this.props.noTasks}
                                                selectProject={this.selectProject.bind(this)}
                                                selectTask={this.selectTask.bind(this)}
                                                workspaceSettings={this.props.workspaceSettings}
                                                isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                                getProjectTasks={this.getProjectTasks}
                                                makeProjectFavorite={this.makeProjectFavorite}
                                                removeProjectAsFavorite={this.removeProjectAsFavorite}
                                                projectFavorites={this.props.workspaceSettings.projectFavorites}
                                            />
                                        )}
                                    </div>                            
                                )}
                            </div>
                            <div className={this.state.specFilterNoTasksOrProject.length > 0 ? "project-list__spec_filter_no_task_or_project" : "disabled"}>
                                <span>{this.state.specFilterNoTasksOrProject}</span>
                            </div>
                            { this.state.loadMore &&
                                <div className="project-list-load" onClick={this.loadMoreProjects.bind(this)}>
                                    Load more
                                </div>
                            }
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