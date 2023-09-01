class ClientService extends ClockifyService {
	static async getClientsWithFilter(page, pageSize, filter, archived=false) {
		const baseUrl = await this.apiEndpoint;
		const activeWorkspaceId = await this.workspaceId;
		const clientsUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/clients?page=${page}&pageSize=${pageSize}&name=${filter}&archived=${archived}`;

		return this.apiCall(clientsUrl);
	}

	static async createClient(client) {
		const baseUrl = await this.apiEndpoint;
		const activeWorkspaceId = await this.workspaceId;
		const clientsUrl = `${baseUrl}/v1/workspaces/${activeWorkspaceId}/clients`;

		const body = client;

		return this.apiCall(clientsUrl, 'POST', body);
	}
}
