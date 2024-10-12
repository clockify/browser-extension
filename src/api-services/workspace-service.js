class UserWorkspaceStorage extends ClockifyService {
	constructor(
		storageName = DefaultProjectEnums.DEFAULT_PROJECTS,
		storageItems,
		isPermanent = true
	) {
		super();
		this.storageName = storageName;
		this.isPermanent = isPermanent;

		this.workspaceId = storageItems.workspaceId;
		this.userId = storageItems.userId;

		const ws = storageItems.ws;
		const wsSettings = ws ? JSON.parse(ws) : { forceTasks: false };
		this.forceTasks = wsSettings.forceTasks;

		const str = storageItems.str;
		let storage = str ? JSON.parse(str) : {};
		if (Array.isArray(storage)) {
			const obj = {};
			storage.map((item) => {
				const { userId, workspaceId, project, enabled } = item;
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
						selectedTask: project.selectedTask
							? {
									id: project.selectedTask.id,
									name: project.selectedTask.name,
							  }
							: null,
					},
					enabled,
				};
			});
			this.storage = obj;
			this.store();
		} else {
			this.storage = storage;
		}
	}

	static get userId() {
		return localStorage.getItem('userId');
	}
	static get workspaceId() {
		return localStorage.getItem('activeWorkspaceId');
	}
	static get apiEndpoint() {
		return localStorage.getItem('permanent_baseUrl');
	}
	static get token() {
		return localStorage.getItem('token');
	}

	static async getProjectPickerTaskFilter() {
		const apiEndpoint = await this.apiEndpoint;
		let endPoint = `${apiEndpoint}/v1/user`;
		const { data, error, status } = await this.apiCall(endPoint);
		if (data) {
			return data.settings.projectPickerTaskFilter;
		} else return false;
	}

	static async getSetWorkspaceSettings(projectPickerTaskFilter) {
		const apiEndpoint = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const userSettings = JSON.parse(await localStorage.getItem('userSettings'));
		projectPickerTaskFilter =
			projectPickerTaskFilter ||
			(userSettings && userSettings.projectPickerTaskFilter) ||
			false;
		let endPoint = `${apiEndpoint}/workspaces/${workspaceId}`;
		const { data, error, status } = await this.apiCall(endPoint);
		if (data) {
			const { workspaceSettings, features, featureSubscriptionType } = data;
			workspaceSettings.projectPickerSpecialFilter = projectPickerTaskFilter;
			workspaceSettings.features = {
				featureSubscriptionType,
				customFields: features.includes('CUSTOM_FIELDS'),
				timeTracking: features.includes('TIME_TRACKING'),
			};
			localStorage.setItem(
				'workspaceSettings',
				JSON.stringify(workspaceSettings)
			);
			const {
				forceDescription,
				forceProjects,
				forceTasks,
				forceTags,
				projectPickerSpecialFilter,
				projectFavorites,
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
						customFields: features.includes('CUSTOM_FIELDS'),
						timeTracking: features.includes('TIME_TRACKING'),
					},
				},
			});
		}
		return { data, error, status };
	}

	static async getPermissionsForUser() {
		const activeWorkspaceId = await this.workspaceId;
		const userId = await this.userId;
		const baseUrl = await this.apiEndpoint;
		const workspacePermissionsUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/roles`;
		//const workspacePermissionsUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/permissions`;

		return this.apiCall(workspacePermissionsUrl);
	}

	static async getWorkspacesOfUser() {
		const baseUrl = await this.apiEndpoint;
		const workspacesUrl = `${baseUrl}/workspaces/`;

		return this.apiCall(workspacesUrl);
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
					forceTasks: this.forceTasks,
			  })
			: null;
	}

	setInitialDefaultProject() {
		let workspace = this.Workspace;
		workspace.defaultProject = {
			project: {
				id: DefaultProjectEnums.LAST_USED_PROJECT,
				name: clockifyLocales.LAST_USED_PROJECT,
			},
			enabled: true,
		};
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
							name: project.selectedTask.name,
					  }
					: null,
			},
			enabled: true,
		};
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
		localStorage.setItem(
			this.storageName,
			JSON.stringify(this.storage),
			this.isPermanent ? 'permanent_' : null
		);
	}

	static async getWasRegionalEverAllowed() {
		const baseUrl = await this.apiEndpoint;
		const workspaceId = await this.workspaceId;
		const workspaceRegionalUrl = `${baseUrl}/workspaces/${workspaceId}/payments/was-regional-ever-allowed`;
		return await this.apiCall(workspaceRegionalUrl).then((response) => {
			localStorage.setItem('wasRegionalEverAllowed', response.data);
			return response.data;
		});
	}
}
