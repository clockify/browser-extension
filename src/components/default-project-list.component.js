import * as React from 'react';
import ProjectItem from './project-item.component';
import {ProjectService} from "../services/project-service";
import _, {debounce} from "lodash";
import {LocalStorageService} from "../services/localStorage-service";
import * as ReactDOM from "react-dom";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {DefaultProject} from '../helpers/storageUserWorkspace';

const projectService = new ProjectService();
const localStorageService = new LocalStorageService();
const pageSize = 50;

const _lastUsedProject =  {
    id: getDefaultProjectEnums().LAST_USED_PROJECT,
    name: 'Last used project',
    favorite: false,
    color: '#999999',
    tasks: [],
    client: {
        name: 'ON-TOP'
    }
}

const _withoutClient = 'Without client';

class DefaultProjectList extends React.Component {

    constructor(props) {
        super(props);

        const {forceProjects, forceTasks, projectPickerSpecialFilter} = this.props.workspaceSettings;
        if (forceTasks && !_lastUsedProject.name.includes('task'))
            _lastUsedProject.name += ' and task';

        let {selectedProject} = this.props;
        if (selectedProject && 
            selectedProject.id === _lastUsedProject.id) {
                selectedProject = _lastUsedProject;
        }

        this.state = {
            isOpen: false,
            selectedProject,
            selectedTaskName: selectedProject && selectedProject.selectedTask 
                ? selectedProject.selectedTask.name
                : '',
            projectList: [_lastUsedProject],
            page: 1,
            loadMore: true,
            clientProjects: { _withoutClient: [] },
            title: '',
            filter: '',
            specFilterNoTasksOrProject: "",
            // project
            forceProjects,
            projectRequired: false,
            projectArchived: false,
            projectDoesNotExist: false,
            // task
            forceTasks,
            taskDoesNotExist: false,
            taskRequired: false,
            taskDone: false,

            isSpecialFilter: projectPickerSpecialFilter,
            msg: null,
            darkMode: this.DarkMode
        };
        _lastUsedProject.color = this.getColorForProject(this.state.darkMode);

        this.filterProjects = debounce(this.filterProjects, 500);
        this.openProjectDropdown = this.openProjectDropdown.bind(this);
        this.checkDefaultProjectTask = this.checkDefaultProjectTask.bind(this);
        this.clearProjectFilter = this.clearProjectFilter.bind(this);
    }

    /*  selectedProject
        1) null
        2) { id: LAST_USED_PROJECT }
        3) { id: 123, name: Kika }
        4) { id: 123, name: Kika, selectedTask: { id: 567, name: Tarzan } }
    */

    componentDidMount() {
        this.setState({
            title: this.createTitle()
        });
        this.checkDefaultProjectTask();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.selectedProject !== this.props.selectedProject) {
            this.setState({
                selectedProject: this.props.selectedProject
            }, () => {
                this.checkDefaultProjectTask();
            });
        }
    }

    async checkDefaultProjectTask() {
        const { isPomodoro } = this.props;
        const { forceProjects, forceTasks, projectPickerSpecialFilter } = this.props.workspaceSettings;
        const { storage, defaultProject } = DefaultProject.getStorage(isPomodoro);
        if (!defaultProject)
            return;
        const { projectDB, taskDB, msg, msgId } = await defaultProject.getProjectTaskFromDB(forceTasks);

        const projectDoesNotExist = forceProjects && msgId === 'projectDoesNotExist';
        const projectArchived = forceProjects && msgId === 'projectArchived';
        const projectRequired = projectDoesNotExist || projectArchived;
        
        const taskDoesNotExist = forceTasks && msgId === 'taskDoesNotExist';
        const taskDone = forceTasks && msgId === 'taskDone';
        const taskRequired = taskDoesNotExist || taskDone;

        this.setState({
            forceProjects,
            projectDoesNotExist,
            projectArchived,
            projectRequired,
            forceTasks,
            taskDoesNotExist,
            taskDone,
            taskRequired,
            projectPickerSpecialFilter,
            msg,
            selectedTaskName: taskDB ? taskDB.name : ''
        }, () => {
            title: this.createTitle()
        });
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
        if (page === 1) {
            this.setState({
                projectList: [_lastUsedProject]
            })
        }
        if (!JSON.parse(localStorage.getItem('offline'))) {
            const {filter, forceTasks, projectList, isSpecialFilter, page} = this.state;
            const already = projectList.map(p => p.id);
            projectService.getProjectsWithFilter(filter, page, pageSize, forceTasks, already)
                .then(response => {
                    const projects = response.data;
                    this.setState({
                        projectList: projectList.concat(projects),
                        page: page + 1
                    }, () => {
                        const {filter, projectList} = this.state;
                        this.setState({
                            clientProjects: this.getClients(projectList),
                            loadMore: response.data.length === pageSize ? true : false,
                            specFilterNoTasksOrProject: 
                                this.createMessageForNoTaskOrProject(projects, isSpecialFilter, filter)
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

    groupByClientName(objectArray) {
        return objectArray.reduce((acc, p) => {
            const key = p.client && !!p.client.name
                ? p.client.name
                : _withoutClient;
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
        this.setState({ isOpen: false });
    }

    selectTask(task, project) {
        this.selectProject(Object.assign(project, { selectedTask: task }));
    }

    openProjectDropdown(e) {
        e.stopPropagation();
        if (!JSON.parse(localStorage.getItem('offline'))) {
            this.setState({
                isOpen: true,
                filter: '',
                page: 1,
                projectList: [_lastUsedProject]
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
            clientProjects: { _withoutClient: [] }
        }, () => {
        });
    }

    filterProjects() {
        this.setState({
            projectList: [_lastUsedProject],           
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
        const {selectedProject, selectedTaskName} = this.state;
        let title = 'Select default project';
        if (selectedProject && selectedProject.id) {
            title = 'Project: ' + selectedProject.name;

            if (selectedTaskName) {
                title = title + '\nTask: ' + selectedTaskName;
            }

            if (selectedProject.client && selectedProject.client.name) {
                title = title + '\nClient: ' + selectedProject.client.name;
            }
        }

        return title;
    }


    clearProjectFilter() {
        this.setState({
            projectList: [_lastUsedProject],            
            filter: '',
            page: 1
        }, () => {
            this.getProjects(this.state.page, pageSize);
            document.getElementById('project-filter').value = null
        });
    }

    getColorForProject(darkMode) {
        return darkMode ? '#90A4AE' : '#999999';
    }

    get DarkMode() {
        const userId = localStorageService.get('userId');
        const str = localStorageService.get('darkMode');
        const darkModeFromStorage = str ? JSON.parse(str) : [];
        return darkModeFromStorage
                .find(darkMode => darkMode.userId === userId && darkMode.enabled);
    }


    render() {
        const { 
            selectedProject, selectedTaskName, isOpen, 
            specFilterNoTasksOrProject, loadMore, title,
            projectRequired, projectDoesNotExist, projectArchived, 
            taskRequired, taskDoesNotExist, taskDone
        } = this.state;

        const isLastUsed = selectedProject && selectedProject.id === _lastUsedProject.id;

        const { clientProjects } = this.state;
        const sortedClients = Object.keys(clientProjects).sort();
        const index = sortedClients.indexOf('FAVORITES');
        if (index > 0) {
            const temp = sortedClients[0];
            sortedClients[0] = sortedClients[index];
            sortedClients[index] = temp;
        }

        const className = JSON.parse(localStorage.getItem('offline'))
                ? "project-list-button-offline"
                : projectRequired || taskRequired
                    ? "project-list-button-required"
                    : "project-list-button";

        return (
            <div className="projects-list" title={title}>
                <div 
                    onClick={this.openProjectDropdown}
                    tabIndex={"0"} 
                    onKeyDown={e => {if (e.key==='Enter') this.openProjectDropdown(e)}}
                    className={className}>
                    <span style={{color: selectedProject ? selectedProject.color : "#999999"}}
                            className="project-list-name">
                        {selectedProject ? selectedProject.name : "Add project"}
                        <span className={isLastUsed || selectedTaskName === "" ? "disabled" : ""}>
                            {" : " + selectedTaskName}
                        </span>
                    </span>
                    <span className={isOpen ? 'project-list-arrow-up' : 'project-list-arrow'} >
                    </span>
                </div>
                {projectDoesNotExist &&
                    <div className='error'>Project doesn't exist</div>
                }
                {projectArchived &&
                    <div className='error'>Project is archived</div>
                }
                {taskDoesNotExist && 
                    <div className='error'>Can't save without task</div>
                }
                {taskDone &&
                    <div className='error'>Task "{selectedTaskName}" is Done!</div>
                }

                {isOpen &&
                    <div className="project-list-open">
                    <div onClick={this.closeProjectList.bind(this)} className="invisible"></div>
                    <div className="project-list-dropdown" id="project-dropdown">
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
                            {/* {
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
                                                                isLastUsedProject={project.id === getDefaultProjectEnums().LAST_USED_PROJECT}
                                                            />
                                                        )
                                                    })
                                            }
                                        </div>
                                    )
                                })
                            } */}
                            <div>
                                {(clientProjects['ON-TOP']?clientProjects['ON-TOP']:[]).map(project =>
                                    <ProjectItem
                                        key={project.id}
                                        project={project}
                                        noTasks={this.props.noTasks}
                                        selectProject={this.selectProject.bind(this)}
                                        selectTask={this.selectTask.bind(this)}
                                        workspaceSettings={this.props.workspaceSettings}
                                        isUserOwnerOrAdmin={this.props.isUserOwnerOrAdmin}
                                        getProjectTasks={this.getProjectTasks}
                                        isLastUsedProject={project.id === getDefaultProjectEnums().LAST_USED_PROJECT}
                                        projectFavorites={false}
                                    />
                                )}
                            </div>
                            <div>
                                {sortedClients.filter(client => client !== 'ON-TOP').map(client => 
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
                                                isLastUsedProject={project.id === getDefaultProjectEnums().LAST_USED_PROJECT}
                                                makeProjectFavorite={this.makeProjectFavorite}
                                                removeProjectAsFavorite={this.removeProjectAsFavorite}
                                                projectFavorites={this.props.workspaceSettings.projectFavorites}
                                            />
                                        )}
                                    </div>                            
                                )}
                            </div>

                            <div className={specFilterNoTasksOrProject.length > 0 ? "project-list__spec_filter_no_task_or_project" : "disabled"}>
                                <span>{specFilterNoTasksOrProject}</span>
                            </div>
                            <div className={loadMore ? "project-list-load" : "disabled"}
                                    onClick={this.loadMoreProjects.bind(this)}>Load more
                            </div>
                        </div>
                    </div>
                </div>
                }
                </div>
        )
    }
}

export default DefaultProjectList;