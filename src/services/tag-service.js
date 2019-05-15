import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class TagService extends HttpWrapperService {
    constructor() {
        super();
    }

    getAllTags() {
        const baseUrl = localStorageService.get('baseUrl');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        let getTagsUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/tags`;

        return super.get(getTagsUrl, addToken)
    }

}