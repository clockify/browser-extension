class UserService extends Service {

    constructor() {
    }

    static async getUser() {
        const endPoint = `${this.apiEndpoint}/v1/user`;
        const addToken = true;
        return await this.apiCall(endPoint);
    }

    static async getAndStoreUser() {
        if (isNavigatorOffline()) 
            return;
    
        const { data, error } = await this.getUser();
        if (data) {
            const { email, id, activeWorkspace, settings } = data;
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', id);
            localStorage.setItem('activeWorkspaceId', activeWorkspace);
            localStorage.setItem('userSettings', JSON.stringify(settings));

            UserWorkspaceStorage.getSetWorkspaceSettings();
        }
    }

}