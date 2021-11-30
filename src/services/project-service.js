import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class ProjectService extends HttpWrapperService {

    constructor() {
        super();
    }

    getProjectsByIds(projectIds) {
        const baseUrl = localStorageService.get('baseUrl');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const projectUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/projects/ids`;
        const body = {
            ids: projectIds
        };
        return super.post(projectUrl, body, addToken);
    }

    getProjects(page, pageSize, favorites) {
        const filter = '';
        return this.getProjectsWithFilter(filter, page, pageSize, favorites);
    }


    dopuniFavs(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        let url = `${projectUrl}&page=${page}&pageSize=${pageSize}&favorites=true`;  // 
        return super.get(url, addToken)
            .then(response => {
                response.data.forEach(project => {
                    if (!alreadyIds.includes(project.id) &&
                        data.length < pageSize &&
                        (!forceTasks || project.taskCount > 0))
                       data.push(project);
                });
                return Promise.resolve(data);
                // no paging for favorites
                // if (response.data.length < pageSize || data.length >= pageSize) {
                //     return Promise.resolve(data);
                // }
                // return this.dopuniFavs(alreadyIds, projectUrl, data, page+1, pageSize, forceTasks)
                //         .then(data => Promise.resolve(data));
            })
            .catch(error => {
                return Promise.resolve(data);
            });        
    }

    /*dopuniNonFavorites(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        let url = `${projectUrl}&pageSize=${pageSize}&page=${page}`;  // &favorites=false
        return super.get(url, addToken)
            .then(response => {
                const x = data.length;
                response.data.forEach(project => {
                    if (!project.favorite &&
                        !alreadyIds.includes(project.id) &&
                        data.length < pageSize &&
                        (!forceTasks || project.taskCount > 0)) 
                      data.push(project);
                });
                if (response.data.length < pageSize || data.length >= pageSize) {
                    return Promise.resolve(data);
                }
                return this.dopuniNonFavorites(alreadyIds, projectUrl, data, page+1, pageSize, forceTasks)
                        .then(data => Promise.resolve(data));
            })
            .catch(error => {
                return Promise.resolve(data);
            });        
    }*/

    dopuniNonFavorites(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        //const userSettings = JSON.parse(localStorage.getItem('userSettings'));
        //const {collapseAllProjectLists, projectListCollapse} = userSettings;
        let url = `${projectUrl}&page=${page}`;  // &favorites=false  &pageSize=${pageSize}
        return super.get(url, addToken)
            .then(response => {
                const x = data.length;
                // response.data.forEach(project => {
                //     console.log(project.id, project.client.name, project.name)
                // })
                response.data.forEach(project => {
                    if (!project.favorite &&
                        !alreadyIds.includes(project.id) &&
                        data.length < pageSize &&
                        (!forceTasks || project.taskCount > 0)) 
                      data.push(project);
                });
                if (response.data.length < pageSize || data.length >= pageSize) {
                    return Promise.resolve(data);
                }
                return this.dopuniNonFavorites(alreadyIds, projectUrl, data, page+1, pageSize, forceTasks)
                        .then(data => Promise.resolve(data));
            })
            .catch(error => {
                return Promise.resolve(data);
            });        
    }

    dopuniPage(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        let url = `${projectUrl}&page=${page}`;  // &favorites=false
        return super.get(url, addToken)
            .then(response => {
                const x = data.length;
                response.data.forEach(project => {
                    if (!alreadyIds.includes(project.id) &&
                        data.length < pageSize &&
                        (!forceTasks || project.taskCount > 0)) 
                      data.push(project);
                });
                if (response.data.length < pageSize || data.length >= pageSize) {
                    return Promise.resolve(data);
                }
                return this.dopuniPage(alreadyIds, projectUrl, data, page+1, pageSize, forceTasks)
                        .then(data => Promise.resolve(data));
            })
            .catch(error => {
                return Promise.resolve(data);
            });        
    }


    getProjectsWithFilter(filter, page, pageSize, forceTasks=false, alreadyIds=[]) {
        const filterTrimmedEncoded = encodeURIComponent(filter.trim())
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const projectUrlFavs = `${baseUrl}/workspaces/${activeWorkspaceId}/project-picker/projects?search=${filterTrimmedEncoded}`;
        const projectUrlNonFavs = `${baseUrl}/workspaces/${activeWorkspaceId}/project-picker/projects?favorites=false&clientId=&excludedTasks=&search=${filterTrimmedEncoded}&userId=`;

        const str = localStorageService.get('workspaceSettings');
        const ws = str ? JSON.parse(str) : { projectFavorites: true }

        if (ws.projectFavorites) {
            return this.dopuniFavs(alreadyIds, projectUrlFavs, [], 1, pageSize, forceTasks) // always go page:1
                .then(data => {
                    if (data.length >= pageSize) {
                        return Promise.resolve({data});
                    }
                    // alreadyIds.concat(data.map(p => p.id)
                    return this.dopuniNonFavorites(alreadyIds, projectUrlNonFavs, data, page, pageSize, forceTasks) // always go page:1
                        .then(data => Promise.resolve({data}));
                })
                .catch(() => {
                    return Promise.resolve({data});
                });
        }
        else {
            return this.dopuniPage(alreadyIds, projectUrlNonFavs, [], page, pageSize, forceTasks) // always go page:1
                .then(data => {
                    return Promise.resolve({data});
                })
                .catch(() => {
                    return Promise.resolve({data});
                });
        }
    }

    getProjectTasksWithFilter(projectId, filter, page) {
        const filterTrimmedEncoded = encodeURIComponent(filter.trim())
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const projectUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/project-picker/` +
            `projects/${projectId}/tasks?page=${page}&search=${filterTrimmedEncoded}`;  // &favorites
        return super.get(projectUrl, addToken);
    }


    getAllTasks(taskIds) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const getAllTasksUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/taskIds`;
        const body = {
            ids: taskIds
        };

        return super.post(getAllTasksUrl, body, addToken);
    }

    getLastUsedProject(forceTasks) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const url = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/lastUsed?type=PROJECT${forceTasks?'_AND_TASK':''}`;
        return super.get(url, addToken);
    }

    getTaskOfProject(projectId, taskName) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const url = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks?name=${taskName}&strict-name-search=true`;
        return super.get(url, addToken);
    }

    createProject(project) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const createProjectUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/projects`;
        const body = project;

        return super.post(createProjectUrl, body, addToken);
    }

    createTestTask(task) {
        const { projectId, name } = task;
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const url = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks`;
        const body = task;

        return super.post(url, body, addToken);
    }

    makeProjectFavorite(projectId) {
        const baseUrl = localStorageService.get('baseUrl');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const url = `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/projects/favorites/${projectId}`;
        const body = {};

        return super.post(url, body, addToken);
    }

    removeProjectAsFavorite(projectId) {
        const baseUrl = localStorageService.get('baseUrl');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const url = `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/projects/favorites/projects/${projectId}`;
        const body = {};

        return super.delete(url, body, addToken);
    }


}