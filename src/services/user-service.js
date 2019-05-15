import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class UserService extends HttpWrapperService {
    constructor() {
        super();
    }

    getUser(userId) {
        const baseUrl = localStorageService.get('baseUrl');
        const userUrl = `${baseUrl}/users/${userId}`;

        return super.get(userUrl, addToken);
    }

    setDefaultWorkspace(workspaceId) {
        const userId = localStorageService.get('userId');
        const baseUrl = localStorageService.get('baseUrl');
        const saveWorkspaceUrl =
            `${baseUrl}/users/${userId}/defaultWorkspace/${workspaceId}`;

        return super.post(saveWorkspaceUrl, '', addToken);

    }
}