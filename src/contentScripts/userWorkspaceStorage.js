class UserWorkspaceStorage {

    constructor(storageName=DefaultProjectEnums.DEFAULT_PROJECTS, isPermanent=true) 
    {
        this.storageName = storageName;
        this.isPermanent = isPermanent;

        this.workspaceId = localStorage.getItem('activeWorkspaceId');
        this.userId = localStorage.getItem('userId');
        
        const ws = localStorage.getItem('workspaceSettings');
        const wsSettings = ws ? JSON.parse(ws) : { forceTasks: false };
        this.forceTasks = wsSettings.forceTasks;

        const str = localStorage.getItem(`${isPermanent ? 'permanent_' : ''}${storageName}`);
        let storage = str ? JSON.parse(str) : {};
        if (Array.isArray(storage)) {
            const obj = {};
            storage.map(item => {
                const {userId, workspaceId, project, enabled} = item;
                let user = obj[userId];
                if (!user) {
                    user = obj[userId] = {};
                }
                let workspace = user[workspaceId];
                if (!workspace) {
                    workspace = user[workspaceId] = {};
                }
                workspace.defaultProject = {
                    project: { 
                        id: project.id,
                        name: project.name,
                        selectedTask: project.selectedTask ? {
                            id: project.selectedTask.id,
                            name: project.selectedTask.name
                        } : null
                    }, 
                    enabled
                }
            })
            this.storage = obj;
            this.store();
        }
        else {
            this.storage = storage;
        }
    }

    static get userId() { return localStorage.getItem('userId') }
    static get workspaceId() { return localStorage.getItem('activeWorkspaceId') }
    static get apiEndpoint() { return localStorage.getItem('permanent_baseUrl') }
    static get token() { return localStorage.getItem('token') }

    static async getProjectPickerTaskFilter() {
        let endPoint = `${this.apiEndpoint}/v1/user`;
        const { data, error, status } = await ClockifyService.apiCall(endPoint);
        if (data) {
            return data.settings.projectPickerTaskFilter;
        }
        else
            return false;
    }

    static async getSetWorkspaceSettings() {
        let endPoint = `${this.apiEndpoint}/workspaces/${this.workspaceId}`;
        const { data, error, status } = await ClockifyService.apiCall(endPoint);
        if (data) {
            const { workspaceSettings, features } = data;
            console.log({ workspaceSettings, features })
            workspaceSettings.projectPickerSpecialFilter = await UserWorkspaceStorage.getProjectPickerTaskFilter();
            workspaceSettings.features = { 
                customFields: features.some(feature => feature === "CUSTOM_FIELDS")
            }
            localStorage.setItem('workspaceSettings', JSON.stringify(workspaceSettings));
            const { forceDescription,
                    forceProjects,
                    forceTasks,
                    forceTags,
                    projectPickerSpecialFilter,
                    projectFavorites
            } = workspaceSettings;
            aBrowser.storage.local.set({
                wsSettings: {
                    forceDescription,
                    forceProjects,
                    forceTasks,
                    forceTags,
                    projectPickerSpecialFilter,
                    projectFavorites,
                    features: { 
                        customFields: features.some(feature => feature === "CUSTOM_FIELDS")
                    }
                }
            });
        }
    }


    get Workspace() {
        const storage = this.storage;
        let user = storage[this.userId];
        if (!user) {
            user = storage[this.userId] = {};
        }
        let workspace = user[this.workspaceId];
        if (!workspace) {
            workspace = user[this.workspaceId] = {};
        }
        return workspace;
    }

    get Storage() {
        return this.storage;
    }


    get defaultProject() {
        const workspace = this.Workspace;
        return workspace.defaultProject 
            ? new DefaultProject(workspace.defaultProject, {
                workspaceId: this.workspaceId,
                userId: this.userId,
                forceTasks: this.forceTasks
            })
            : null;
    }

    setInitialDefaultProject() {
        let workspace = this.Workspace;
        workspace.defaultProject = {
            project: {
                id: DefaultProjectEnums.LAST_USED_PROJECT,
                name: 'Last used project'
            },
            enabled: true
        }
        this.store();
        return workspace.defaultProject;
    }

    setDefaultProject(project) {
        let workspace = this.Workspace;
        workspace.defaultProject = {
            project: { 
                id: project.id,
                name: project.name,
                selectedTask: project.selectedTask 
                    ? {
                        id: project.selectedTask.id,
                        name: project.selectedTask.name
                    }
                    : null
            }, 
            enabled: true
        }
        this.store();
    }

    toggleEnabledOfDefaultProject() {
        const workspace = this.Workspace;
        const { defaultProject } = workspace;
        if (defaultProject) {
            defaultProject.enabled = !defaultProject.enabled;
            this.store();
        }
    }

    removeDefaultProject() {
        const workspace = this.Workspace;
        workspace.defaultProject = null;
    }

    store() {
        localStorageService.set(
            this.storageName,
            JSON.stringify(this.storage),
            this.isPermanent ? 'permanent_' : null
        );
    }

}
