var DefaultProjectEnums = {
	DEFAULT_PROJECTS: 'defaultProjects',
	POMODORO_BREAK_DEFAULT_PROJECTS: 'PomodoroBreakDefaultProjects',
	LAST_USED_PROJECT: 'lastUsedProject',
};

// class DefaultProjectEnums {

//     static get DEFAULT_PROJECTS () {
//         return "defaultProjects"
//     }

//     static get POMODORO_BREAK_DEFAULT_PROJECTS () {
//         return "PomodoroBreakDefaultProjects"
//     }

//     static get LAST_USED_PROJECT () {
//         return "lastUsedProject"
//     }
// }

class DefaultProject {
	constructor(defaultProject, { userId, workspaceId, forceTasks }) {
		this.userId = userId;
		this.workspaceId = workspaceId;
		this.forceTasks = forceTasks;
		this.project = defaultProject.project;
		this.enabled = defaultProject.enabled;
	}

	//  project {
	//      { id: LAST_USED_PROJECT }
	//      { id: 123, name: Kika }
	//      { id: 123, name: Kika, selectedTask: { id: 567, name: Tarzan } }
	//  }

	get isLastUsed() {
		return (
			this.project && this.project.id === DefaultProjectEnums.LAST_USED_PROJECT
		);
	}

	get apiEndpoint() {
		return localStorage.getItem('permanent_baseUrl');
	}

	get token() {
		return localStorage.getItem('token');
	}

	static async getStorage(isPomodoro = false) {
		const storageName = isPomodoro
			? DefaultProjectEnums.POMODORO_BREAK_DEFAULT_PROJECTS
			: DefaultProjectEnums.DEFAULT_PROJECTS;

		const workspaceId = await localStorage.getItem('activeWorkspaceId');
		const userId = await localStorage.getItem('userId');
		const ws = await localStorage.getItem('workspaceSettings');
		const isPermanent = true;
		const str = await localStorage.getItem(
			`${isPermanent ? 'permanent_' : ''}${storageName}`
		);

		const storage = new UserWorkspaceStorage(storageName, {
			workspaceId,
			userId,
			ws,
			str,
		});
		const defaultProject = storage.defaultProject;
		return { storage, defaultProject };
	}

	static async getProjectTaskFromDB(isPomodoro = false) {
		const res = { projectDB: null, taskDB: null, msg: '', msgId: null };
		if (await isNavigatorOffline()) return res;

		const { storage, defaultProject } = await this.getStorage(isPomodoro);

		if (!defaultProject) return res;

		if (!defaultProject.enabled || !defaultProject.project) return res;

		if (
			isPomodoro &&
			defaultProject.project.id === DefaultProjectEnums.LAST_USED_PROJECT
		) {
			// we use current Project, as lastUsedProject
			return {
				projectDB: defaultProject.project,
				taskDB: null,
			};
		}
		const { projectDB, taskDB, msg, msgId } =
			await defaultProject._getProjectTaskFromDB();
		// let us try to notify here
		if (msg && TimeEntry.doAlert) {
			// alert(msg)
			 
			localStorage.setItem('integrationAlert', msg);
		}
		return { projectDB, taskDB, msg, msgId };
	}

	getProjectTaskIds() {
		return {
			projectId: this.project.id,
			taskId: this.project.selectedTask ? this.project.selectedTask.id : null,
		};
	}

	async _getProjectTask(forceTasks = false) {
		const { id, selectedTask } = this.project;
		if (id === DefaultProjectEnums.LAST_USED_PROJECT) {
			const isLastUsedProjectWithTask = this.project.name.includes('task');
			let lastEntry;
			let projectDB = null;
			let taskDB = null;
			
			const lastEntryRes = await ProjectTaskService.getLastUsedProjectFromTimeEntries(
				isLastUsedProjectWithTask
			);
			 
			if(lastEntryRes.error) return { projectDB, taskDB };
			
			lastEntry = {
				project: lastEntryRes.data.project ?? lastEntryRes.data,
				task: lastEntryRes.data.task ?? null,
			};
			 	
			if (lastEntry && lastEntry.project) {
				({ projectDB, taskDB } = await ProjectTaskService.getProjectsByIds([
					lastEntry.project.id,
				]));
				if (projectDB) {
					if (
						!projectDB.archived &&
						isLastUsedProjectWithTask &&
						lastEntry.task?.id
					) {
						taskDB = await ProjectTaskService.getTask(lastEntry.task.id);
						if (taskDB) {
							taskDB.isDone = taskDB.status === 'DONE';
						}
					}
				}
			}

			return { projectDB, taskDB };
		} else {
			const taskIds = selectedTask ? [selectedTask.id] : null;
			const { projectDB } = await ProjectTaskService.getProjectsByIds(
				[id],
				taskIds
			);
			let taskDB = null;
			if (projectDB) {
				if (!projectDB.archived && selectedTask) {
					taskDB = await ProjectTaskService.getTask(selectedTask.id);
					if (taskDB) {
						taskDB.isDone = taskDB.status === 'DONE';
					}
				}
			}
			return { projectDB, taskDB };
		}
	}

	async _getProjectTaskFromDB() {
		if (await isNavigatorOffline())
			return { projectDB: null, taskDB: null, msg: null, msgId: null };
		let msg = null;
		let msgId = null;
		if (this.enabled) {
			let { projectDB, taskDB } = await this._getProjectTask(this.forceTasks);
			 
			if (projectDB) {
				if (projectDB.archived) {
					// storage.removeDefaultProject();
					msg = `${clockifyLocales.DEFAULT_PROJECT_ARCHIVED}. ${clockifyLocales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}.`;
					msgId = 'projectArchived';
					projectDB = null;
				} else {
					  
					 const isLastUsedProjectWithTask =
						this.project.id === 'lastUsedProject' &&
						this.project.name.includes('task');
					if (this.forceTasks && isLastUsedProjectWithTask) {
						if (taskDB) {
							if (taskDB.isDone) {
								taskDB = null;
								msg = `${clockifyLocales.DEFAULT_TASK_DONE}. ${clockifyLocales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}.`;
								msgId = 'taskDone';
							}
						} else {
							msg = `${clockifyLocales.DEFAULT_TASK_DOES_NOT_EXIST}. ${clockifyLocales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}.`;
							msgId = 'taskDoesNotExist';
						}
					}
				}
				 
				return { projectDB, taskDB, msg, msgId };
			} else {
				// storage.removeDefaultProject();
				msg = `${clockifyLocales.DEFAULT_PROJECT_NOT_AVAILABLE} ${clockifyLocales.YOU_CAN_SET_A_NEW_ONE_IN_SETTINGS}`;
				msgId = 'projectDoesNotExist';
			}
		}
		 
		return { projectDB: null, taskDB: null, msg, msgId };
	}
}
