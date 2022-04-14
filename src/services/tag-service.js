import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class TagService extends HttpWrapperService {
    constructor() {
        super();
    }

    async getAllTagsWithFilter(page, pageSize, filter) {
        const baseUrl = await localStorageService.get('baseUrl');
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        let getTagsUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/tags` +
            `?page=${page}&pagesize=${pageSize}&archived=false`;
        if (!!filter) {
            getTagsUrl = getTagsUrl.concat(`&name=${filter}`);
        }
        return super.get(getTagsUrl, addToken);
    }

    async createTag(tag) {
        const baseUrl = await localStorageService.get('baseUrl');
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const createTagUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/tags`;

        const body = tag;

        return super.post(createTagUrl, body, addToken);
    }
}