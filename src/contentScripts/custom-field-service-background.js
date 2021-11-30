class CustomFieldService extends ClockifyService {

    constructor() {
    }


    static get url()  {
        // https://global.api.clockify.me/workspaces/61237bdb9737ba60e3cbdab0/timeEntries/61277fdfb7753e6977f72366/custom-field
        return `${this.apiEndpoint}/workspaces/${this.workspaceId}/timeEntries`;
    }
  
    static async getWSCustomField(name) {
        const nameParam = name ? `?name=${encodeURIComponent(name)}` : '';
        const endPoint = `${this.apiEndpoint}/workspaces/${this.workspaceId}/custom-field${nameParam}`;
        return await this.apiCall(endPoint);
    }


    static async updateCustomField(timeEntryId, customFieldId, value) {
        const endPoint = `${this.url}/${timeEntryId}/custom-field`;
        const body = {
            customFieldId,
            value
        };
        return await this.apiCall(endPoint, 'PUT', body);
    }

}