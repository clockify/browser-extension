var DefaultProjectEnums = {
    DEFAULT_PROJECTS: "defaultProjects",
    POMODORO_BREAK_DEFAULT_PROJECTS: "PomodoroBreakDefaultProjects",
    LAST_USED_PROJECT: "lastUsedProject"
}


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
        return this.project && this.project.id === DefaultProjectEnums.LAST_USED_PROJECT;
    }

    get apiEndpoint() {
        return localStorage.getItem('permanent_baseUrl');
    }

    get token() {
        return localStorage.getItem('token');
    }
    
    static getStorage(isPomodoro=false) {
        const storageName = isPomodoro
                ? DefaultProjectEnums.POMODORO_BREAK_DEFAULT_PROJECTS
                : DefaultProjectEnums.DEFAULT_PROJECTS;
        const storage = new UserWorkspaceStorage(storageName);
        const defaultProject = storage.defaultProject;
        return { storage, defaultProject };
    }

    static async getProjectTaskFromDB(isPomodoro=false) {
        const res = { projectDB: null, taskDB: null, msg: '', msgId: null }
        if (isNavigatorOffline())
            return res;
        
        const { storage, defaultProject } = this.getStorage(isPomodoro);
    
        if (!defaultProject)
            return res;
    
        if (!defaultProject.enabled || !defaultProject.project)
            return res;
    
        if (isPomodoro && defaultProject.project.id === DefaultProjectEnums.LAST_USED_PROJECT) {
            // we use current Project, as lastUsedProject
            return {
                projectDB: defaultProject.project, 
                taskDB: null 
            };
        }
        const { projectDB, taskDB, msg, msgId } = await defaultProject._getProjectTaskFromDB();
        // let us try to notify here
        if (msg && TimeEntry.doAlert) {
            alert(msg)
        }
        return { projectDB, taskDB, msg, msgId }
    }

    getProjectTaskIds() {
        return { 
            projectId: this.project.id,
            taskId: this.project.selectedTask ? this.project.selectedTask.id : null
        }
    }

    async _getProjectTask(forceTasks=false) {
        const { id, selectedTask } = this.project;
        if (id === DefaultProjectEnums.LAST_USED_PROJECT) {
            return ProjectService.getLastUsedProjectFromTimeEntries(forceTasks);
        } 
        else {
            const taskIds = selectedTask ? [selectedTask.id] : null;
            const { projectDB } = await ProjectService.getProjectsByIds([id], taskIds);
            let taskDB = null;
            if (projectDB) {
                if (!projectDB.archived && selectedTask && forceTasks) {
                    taskDB = await TaskService.getTask(selectedTask.id);
                    if (taskDB) {
                        taskDB.isDone = taskDB.status === 'DONE'
                    }
                }
            }
            return { projectDB, taskDB }
        }
    }

    async _getProjectTaskFromDB() {
        if (isNavigatorOffline())
            return {projectDB: null, taskDB: null, msg: null, msgId: null};
        let msg = null;
        let msgId = null;
        if (this.enabled) {
            let { projectDB, taskDB } = await this._getProjectTask(this.forceTasks);
            if (projectDB) {
                if (projectDB.archived) {
                    // storage.removeDefaultProject();
                    msg = `Your default project is archived. You can set a new one in Settings.`;
                    msgId = 'projectArchived';
                    projectDB = null;
                }
                else {
                    if (this.forceTasks) {
                        if (taskDB) {
                            if (taskDB.isDone) {
                                taskDB = null;
                                msg = `Your default task is Done, no longer available. You can set a new one in Settings.`;
                                msgId = 'taskDone';
                            }
                        }
                        else {
                            msg = `Default task doesn't exist. You can set a new one in Settings.`;
                            msgId = 'taskDoesNotExist';
                        }
                    }
                }
                return {projectDB, taskDB, msg, msgId};
            }
            else {
                // storage.removeDefaultProject();
                msg = `Your default project is no longer available. You can set a new one in Settings.`;
                msgId = "projectDoesNotExist";
            }
        }
        return {projectDB: null, taskDB: null, msg, msgId};
    }
   
}
