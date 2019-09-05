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

    getAllProjects() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const getAllProjectsUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/`;

        return super.get(getAllProjectsUrl, addToken);
    }

    getProjects(page, pageSize) {
        const filter = '';

        return this.getProjectsWithFilter(filter, page, pageSize);
    }

    getProjectsWithFilter(filter, page, pageSize) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const projectUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/projects/user/${userId}/` +
            `filter?page=${page}&search=${filter}&pageSize${pageSize}`;

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

    getLastUsedProject() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const getLastUsedUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/last-used`;

        return super.get(getLastUsedUrl, addToken);
    }

    createProject(project) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const createProjectUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/projects`;
        const body = project;

        return super.post(createProjectUrl, body, addToken);
    }

    getProjectsPermissions(ids) {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const projectPermissionsUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/users/${userId}/permissions`;
        const body = {projectIds: ids};

        return super.post(projectPermissionsUrl, body, addToken);
    }
}