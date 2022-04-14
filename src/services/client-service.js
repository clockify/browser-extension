import {LocalStorageService} from "./localStorage-service";
import {HttpWrapperService} from "./http-wrapper-service";

const localStorageService = new LocalStorageService();
const addToken = true;

export class ClientService extends HttpWrapperService {

    constructor() {
        super();
    }

    async getClientsWithFilter(page, pageSize, filter) {
        const baseUrl = await localStorageService.get('baseUrl');
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const clientsUrl =
            `${baseUrl}/v1/workspaces/${activeWorkspaceId}/clients?page=${page}&pageSize=${pageSize}&name=${filter}`;

        return super.get(clientsUrl, addToken);
    }

    async createClient(client) {
        const baseUrl = await localStorageService.get('baseUrl');
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const clientsUrl =
            `${baseUrl}/v1/workspaces/${activeWorkspaceId}/clients`;

        const body = client;

        return super.post(clientsUrl, body, addToken);
    }
}

export default ClientService;