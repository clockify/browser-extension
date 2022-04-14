class UserService extends ClockifyService {

    constructor() {
    }

    static async getUser() {
        const apiEndpoint = await this.apiEndpoint;
        const endPoint = `${apiEndpoint}/v1/user`;
        const addToken = true;
        return await this.apiCall(endPoint);
    }

    static async getAndStoreUser() {
        if (await isNavigatorOffline()) 
            return;
    
        const { data, error } = await this.getUser();
        if (data) {
            const { email, id, activeWorkspace, settings } = data;
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', id);
            localStorage.setItem('activeWorkspaceId', activeWorkspace);
            localStorage.setItem('userSettings', JSON.stringify(settings));
            if(settings.lang){
                localStorage.setItem('lang', settings.lang.toLowerCase());
            }

            UserWorkspaceStorage.getSetWorkspaceSettings();
            UserService.getSetUserRoles();
        }
    }

    static async getUserRoles() {
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        const userId = await this.userId;
        const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/users/${userId}/roles`;
        return await this.apiCall(endPoint);
    }

    static async getSetUserRoles() {
        // aBrowser.storage.local.set({
        //     userRoles: []
        // });
        const { data, error, status } = await UserService.getUserRoles();
        if (data) {
            const { userRoles } = data;
            aBrowser.storage.local.set({
                userRoles
            });
        }
        else {
            console.log('getSetUserRoles failure')
        }
    }

}