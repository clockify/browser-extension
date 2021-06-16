import {ProjectService} from "../services/project-service";
import {WorkspaceService} from "../services/workspace-service";
import {getDefaultProjectEnums} from "../enums/default-project.enum";
import {getWorkspacePermissionsEnums} from "../enums/workspace-permissions.enum";
import {isOffline} from "../components/check-connection";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {DefaultProject, StorageUserWorkspace} from './storageUserWorkspace';

const projectService = new ProjectService();
const workspaceService = new WorkspaceService();
const localStorageService = new LocalStorageService();

export class ProjectHelper {
    constructor() {
    }

    async getLastUsedProjectFromTimeEntries(forceTasks) {
        return projectService.getLastUsedProject(forceTasks).then(response => {
            if (response.data) {
                return response.data;
            } else {
                return null;
            }
        });
    }

    async getProjectsByIds(projectIds) {
        return projectService.getProjectsByIds(projectIds).then(response => {
            if (response.data.length > 0) {
                return response.data[0];
            } else {
                return null;
            }
        })
        .catch(() => {
            return null;
        });
    }

    createMessageForNoTaskOrProject(projects, isSpecialFilter, filter) {
        if (!isSpecialFilter || filter.length === 0 || projects.length > 0) return ""
        
        if (!filter.includes("@")) {
            return "No matching tasks. Search projects with @project syntax"
        } else {
            return "No matching projects"
        }
    }


    async getProjectForButton(projectName) {
        const page = 0;
        const pageSize = 50;
        let projectFilter;
        let project = null;

        const str = localStorageService.get('workspaceSettings');
        const workspaceSettings = str ? JSON.parse(str) : {};
        const { projectPickerSpecialFilter, forceTasks } = workspaceSettings;
        
        if (!!projectName) {
            projectName = projectName.trim().replace(/\s+/g, ' ');

            if (projectPickerSpecialFilter) {
                // cekamo project-picker tim da vidi sta ce sa '@' unutar naziva projekta ili taska
                projectFilter = '@' + projectName; // don't encode twice encodeURIComponent(projectName);  
            } else {
                projectFilter = projectName;
            }

            console.log('projectService.getProjectsWithFilter projectFilter', projectFilter)
            return projectService.getProjectsWithFilter(projectFilter, page, pageSize)
                .then(async response => {
                    console.log('projectService.getProjectsWithFilter response', response)
                    if (response && response.data && response.data.length > 0) {
                        project = response.data.filter(p => p.name === projectName)[0];
                    }
                    if (project) {
                        return { projectDB: project,  taskDB: null, found: true };
                    }

                    if (JSON.parse(localStorageService.get('createObjects', false))) {
                        return projectService.createProject({
                                name: projectName
                                // , clientId: ""
                            })
                            .then(async response => {
                                if (response.status === 201) {
                                    return { projectDB: response.data, taskDB: null, created: true };
                                } 
                                else {
                                    // something went wrong, ignore and return default project
                                    return await this.checkDefaultProjectTask(forceTasks);
                                }
                            })
                            .catch(async error => {
                                const onlyAdminsCanCreateProjects = error.toString().includes('403');
                                const {projectDB, taskDB, msg} = await this.checkDefaultProjectTask(forceTasks);
                                return {projectDB, taskDB, msg, onlyAdminsCanCreateProjects};
                            });
                    } 
                    else {
                        return await this.checkDefaultProjectTask(forceTasks);
                    }
                });
        } 
        else {
            return await this.checkDefaultProjectTask(forceTasks);
        }
    }

    async checkDefaultProjectTask(forceTasks) {
        const { defaultProject } = DefaultProject.getStorage();
        if (defaultProject) {
            const { projectDB, taskDB, msg, msgId } = await defaultProject.getProjectTaskFromDB(forceTasks);
            if (msg) {
                console.log(msg)
            }
            return {projectDB, taskDB, takenFromDefaultProjectTask: true};
        }
        return {projectDB: null, taskDB: null, takenFromDefaultProjectTask: true};
    }


    // slavko took from project-list.component
    getProjects({filter, page, pageSize}) {
        const workspaceSettings = localStorageService.get('workspaceSettings') 
            ? JSON.parse(localStorageService.get('workspaceSettings'))
            : null;  
        const isSpecialFilter = workspaceSettings && workspaceSettings.projectPickerSpecialFilter 
            ? workspaceSettings.projectPickerSpecialFilter
            : false;

        //if (isSpecialFilter)
        //    filter = '@' + filter;

        let projectList = [];
        if (page === 1) {
            if (!workspaceSettings.forceProjects) //  && this.props.selectedProject)
                projectList.push(
                    { name: 'No project', id: 'no-project', color: '#999999', tasks: [] }
                )
        }
        if (!JSON.parse(localStorage.getItem('offline'))) {
            return projectService.getProjectsWithFilter(filter, page, pageSize)
                .then(response => {
                    projectList = projectList.concat(response.data);
                    return Promise.resolve({
                        status: 201,
                        data: {
                            projectList: projectList,
                            clients: this.getClients(projectList),
                            specFilterNoTasksOrProject: 
                                this.createMessageForNoTaskOrProject(
                                    response.data, isSpecialFilter, filter
                                )
                        }
                    })
                })
                .catch(() => {
                });
        } else {
        }
    }

    // getProjectTask({projectId, taskName}) {
    getTaskOfProject({projectId, taskName}) {
        const workspaceSettings = localStorageService.get('workspaceSettings') 
            ? JSON.parse(localStorageService.get('workspaceSettings'))
            : null;  
        if (!JSON.parse(localStorage.getItem('offline'))) {
            return projectService.getTaskOfProject(projectId, taskName)
                .then(response => {
                    return Promise.resolve({
                        status: 200,
                        data: {
                            taskList: response.data,
                        }
                    })
                })
                .catch(() => {
                });
        }
    }

    getProjectTasks({projectId, filter, page}) {
        const workspaceSettings = localStorageService.get('workspaceSettings') 
            ? JSON.parse(localStorageService.get('workspaceSettings'))
            : null;  
        const isSpecialFilter = workspaceSettings && workspaceSettings.projectPickerSpecialFilter 
            ? workspaceSettings.projectPickerSpecialFilter
            : false;

        //if (isSpecialFilter)
        //    filter = '@' + filter;

        if (!JSON.parse(localStorage.getItem('offline'))) {
            return projectService.getProjectTasksWithFilter(projectId, filter, page)
                .then(response => {
                    return Promise.resolve({
                        status: 201,
                        data: {
                            taskList: response.data,
                        },
                        specFilterNoTasksOrProject: 
                            this.createMessageForNoTaskOrProject(
                                response.data, isSpecialFilter, filter
                            )
                    })
                })
                .catch(() => {
                });
        } else {
        }
    }


    async getProjectsByIdsForIntegration({ projectIds, taskIds }) {
        return projectService.getProjectsByIds(projectIds)
            .then(response => {
                if (taskIds) {
                    const project = response.data[0];
                    return projectService.getAllTasks(taskIds)
                        .then((response) => {
                            project.tasks = [response.data[0]];
                            return Promise.resolve({
                                status: 200,
                                data: [project]
                            })
                        })
                        .catch((error) => {
                            console.log('salje error:', error)
                            sendResponse(error)
                        }) 
                }
                else return Promise.resolve({
                    status: 200,
                    data: response.data
                })
            })
            .catch(() => {
                return Promise.resolve(null)
            });
    }

    getClients(projects) {
        const clients = new Set(projects.filter(p => p.client).map(p => p.client.name))
        if (projects && projects.length > 0) {
            return ['Without client', ...clients]
        } else {
            return []
        }
    }

    async getAllTasks(taskIds) {
        return projectService.getAllTasks(taskIds)
            .then(response => {
                return Promise.resolve({
                    status: 200,
                    data: response.data
                })
            })
            .catch(() => {
            });
    }

}