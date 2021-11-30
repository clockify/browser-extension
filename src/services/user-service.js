import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class UserService extends HttpWrapperService {
    constructor() {
        super();
    }

    getUser() {
        const baseUrl = localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/v1/user`;

        return super.get(userUrl, addToken);
    }

    getBoot() {
        const homeUrl = localStorageService.get('homeUrl');
        return super.get(`${homeUrl}/web/boot`, addToken);
    }

    setDefaultWorkspace(workspaceId) {
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const saveWorkspaceUrl =
            `${baseUrl}/users/${userId}/defaultWorkspace/${workspaceId}`;

        return super.post(saveWorkspaceUrl, '', addToken);

    }

    getNotifications(userId) {
        const baseUrl = localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}/notifications`;
        return super.get(userUrl, addToken);
    }

    markAsRead(userId, notificationId) {
        const baseUrl = localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}/markAsRead`;
        const body = {
            notificationId
        };
        return super.put(userUrl, body, addToken);
    }

    getProjectPickerTaskFilter(userId) {
        const baseUrl = localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}`;
        return super.get(userUrl, addToken);
    }

    getUserRoles(workspaceId, userId) {
        const baseUrl = localStorageService.get('baseUrl');
        const url = `${baseUrl}/workspaces/${workspaceId}/users/${userId}/roles`;
        return super.get(url, addToken);
    }

}