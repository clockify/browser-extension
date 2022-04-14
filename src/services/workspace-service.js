import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class WorkspaceService extends HttpWrapperService {
    constructor(){
        super();
    }

    async getPermissionsForUser() {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const userId = await localStorageService.get('userId');
        const baseUrl = await localStorageService.get('baseUrl');
        const workspacePermissionsUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/permissions`;

        return super.get(workspacePermissionsUrl, addToken)
            .then(response => response.data);
    }

    async getWorkspaceSettings() {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const workspaceSettingsUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}`;
        return super.get(workspaceSettingsUrl, addToken);
    }

    async getWorkspacesOfUser() {
        const baseUrl = await localStorageService.get('baseUrl');
        const workspacesUrl = `${baseUrl}/workspaces/`;

        return super.get(workspacesUrl, addToken);
    }
}