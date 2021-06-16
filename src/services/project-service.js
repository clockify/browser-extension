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

    // getAllProjects() {
    //     const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
    //     const baseUrl = localStorageService.get('baseUrl');
    //     const getAllProjectsUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/`;

    //     return super.get(getAllProjectsUrl, addToken);
    // }

    getProjects(page, pageSize) {
        const filter = '';
        return this.getProjectsWithFilter(filter, page, pageSize);
    }

    getProjectsWithFilter(filter, page, pageSize) {
        const filterTrimmedEncoded = encodeURIComponent(filter.trim())
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const projectUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/project-picker/` +
             `projects?page=${page}&search=${filterTrimmedEncoded}`;  // &favorites

        return super.get(projectUrl, addToken);
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
}