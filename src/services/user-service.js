import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class UserService extends HttpWrapperService {
    constructor() {
        super();
    }

    async getUser() {
        const baseUrl = await localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/v1/user`;

        return super.get(userUrl, addToken);
    }

    async getBoot() {
        const homeUrl = await localStorageService.get('homeUrl');
        return super.get(`${homeUrl}/web/boot`, addToken);
    }

    async setDefaultWorkspace(workspaceId) {
        const userId = await localStorageService.get('userId');
        const baseUrl = await localStorageService.get('baseUrl');
        const saveWorkspaceUrl =
            `${baseUrl}/users/${userId}/defaultWorkspace/${workspaceId}`;

        return super.post(saveWorkspaceUrl, '', addToken);

    }

    async getNotifications(userId) {
        const baseUrl = await localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}/notifications`;
        return super.get(userUrl, addToken);
    }

    async markAsRead(userId, notificationId) {
        const baseUrl = await localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}/markAsRead`;
        const body = {
            notificationId
        };
        return super.put(userUrl, body, addToken);
    }

    async getProjectPickerTaskFilter(userId) {
        const baseUrl = await localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}`;
        return super.get(userUrl, addToken);
    }

    async getUserRoles(workspaceId, userId) {
        const baseUrl = await localStorageService.get('baseUrl');
        const url = `${baseUrl}/workspaces/${workspaceId}/users/${userId}/roles`;
        return super.get(url, addToken);
    }

}