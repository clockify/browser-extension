import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class WorkspaceService extends HttpWrapperService {
    constructor(){
        super();
    }

    getPermissionsForUser() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const workspacePermissionsUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/permissions`;

        return super.get(workspacePermissionsUrl, addToken)
            .then(response => response.data);
    }

    getWorkspaceSettings() {
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const baseUrl = localStorageService.get('baseUrl');
        const workspaceSettingsUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}`;
        return super.get(workspaceSettingsUrl, addToken);
    }

    getWorkspacesOfUser() {
        const baseUrl = localStorageService.get('baseUrl');
        const workspacesUrl = `${baseUrl}/workspaces/`;

        return super.get(workspacesUrl, addToken);
    }
}