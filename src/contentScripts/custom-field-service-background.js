class CustomFieldService extends ClockifyService {
	constructor() {}
	static async url(endpoint) {
		// https://global.api.clockify.me/workspaces/61237bdb9737ba60e3cbdab0/timeEntries/61277fdfb7753e6977f72366/custom-field
		const workspaceId = await this.workspaceId;
		return `${endpoint}/workspaces/${workspaceId}/timeEntries`;
	}

	static async getWSCustomField(name) {
		const nameParam = name ? `?name=${encodeURIComponent(name)}` : '';
		const endpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const endPoint = `${endpoint}/workspaces/${workspaceId}/custom-field${nameParam}`;
		return await this.apiCall(endPoint);
	}

	static async updateCustomField(timeEntryId, customFieldId, value) {
		const endpoint = await this.apiEndpoint;

		const endPoint = `${await this.url(endpoint)}/${timeEntryId}/custom-field`;
		const body = {
			customFieldId,
			value,
		};
		return await this.apiCall(endPoint, 'PUT', body);
	}
}
