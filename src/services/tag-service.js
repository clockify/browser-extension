import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class TagService extends HttpWrapperService {
    constructor() {
        super();
    }

    getAllTagsWithFilter(page, pageSize, filter) {
        const baseUrl = localStorageService.get('baseUrl');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        let getTagsUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/tags` +
            `?page=${page}&pageSize${pageSize}`;

        if (!!filter) {
            getTagsUrl = getTagsUrl.concat(`&name=${filter}`);
        }

        return super.get(getTagsUrl, addToken);
    }

    createTag(tag) {
        const baseUrl = localStorageService.get('baseUrl');
        const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
        const createTagUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/tags`;

        const body = tag;

        return super.post(createTagUrl, body, addToken);
    }
}