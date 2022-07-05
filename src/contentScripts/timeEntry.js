class TimeEntry extends ClockifyService {

    constructor() {
    }

    static get doAlert() { return this._doAlert; }
    static set doAlert(b) { this._doAlert = b }

    static get timeEntryIdTemp() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    static async getUrlTimeEntries() {
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        return `${apiEndpoint}/workspaces/${workspaceId}/timeEntries`;
    }

    get timeEntryIdTemp() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    static async healthCheck() {
        const baseUrl = await localStorageService.get('baseUrl');
        const entryInProgressUrl = `${baseUrl}/health`;
        return super.get(entryInProgressUrl, addToken);
    }

    static async getEntryInProgress(hydrated=false) {
        //const endPoint = `${this.urlTimeEntries}/inProgress`;
        const apiEndpoint = await this.apiEndpoint;
        const userId = await this.userId;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/user/${userId}/time-entries?in-progress=true${hydrated?'&hydrated=true':''}`;
        const { data, error, status } = await this.apiCall(endPoint);
        if (error) { // entry instanceof Error) {
            console.log('oh no, failed', error.message);
        }
        return { entry: data && data.length > 0 ? data[0] : null, error }
    }

    static async takeTimeEntryInProgress() {
        const isLoggedIn = await TokenService.isLoggedIn();
        if (isLoggedIn) {
            const { entry, error } = await this.getEntryInProgress();
            if (entry === null || error) {
                setTimeEntryInProgress(null);
                aBrowser.action.setIcon({
                    path: iconPathEnded
                });
            }
            else {
                setTimeEntryInProgress(entry);
                aBrowser.action.setIcon({
                    path: iconPathStarted
                });
            }
        }
    }

    
    static async getLastEntry() {
        const apiEndpoint = await this.apiEndpoint;
        const userId = await this.userId;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/user/${userId}/time-entries?page-size=2`;
        const { data: timeEntries, error } = await this.apiCall(endPoint);
        let entry = null;
        if (error) {
            console.error('oh no, failed', error);
        }
        else {
            if (timeEntries && timeEntries.length > 0) {
                entry = timeEntries.find(entry => !!entry.timeInterval.end);
            } 
        }
        return { entry, error }
    }

    static async getTimeEntries(page, limit) {
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        const userId = await this.userId;

        const allTimeEntriesEndpoint =
            `${apiEndpoint}/workspaces/${workspaceId}/timeEntries/user/${userId}/full?page=${page}&limit=${limit}`;

        const { data, error } = await this.apiCall(allTimeEntriesEndpoint);
        if (error) {
            console.error('oh no, failed', error);
        }
        return { data, error };
    }


    static async endInProgress(timeEntry=null, end=new Date()) {
        const inProgress = await this.getEntryInProgress();
        let timeEntryInProgress = inProgress.entry;
        
        if(inProgress.error){
            console.log(inProgress.error);
            return;
        }

        if (timeEntry) {
            const {projectId, task} = timeEntry;
            const { forceProjects, forceTasks } = await this.getForces();
            if (!projectId || forceTasks && !task) {
                const { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
                if (projectDB) {
                    timeEntryInProgress = await this.updateProjectTask(timeEntry, projectDB, taskDB);
                }
            }
        }
        if(!timeEntryInProgress){
            return;
        }
        const { id, projectId, billable, taskId, description, timeInterval, customFieldValues, tagIds  } = timeEntryInProgress;
        const { start } = timeInterval;

        const body = {
            projectId,
            taskId,
            tagIds,
            description,
            start,
            end,
            billable,
            customFields: customFieldValues
        };

        const endPoint =
            `${await this.getUrlTimeEntries()}/${id}/full`;

        const { data: entry, error } = await this.apiCall(endPoint, 'PUT', body);
        if (error) {
            console.error('oh no, failed', error);
            if (error.status === 400) {
                console.log('endInProgress error', error)
            }
        }
        else {
            aBrowser.action.setIcon({ path: iconPathEnded });
            setTimeEntryInProgress(null);
            aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STOPPED'});
        }
        return { entry, error }
    }

    static async endInProgressAndStartNew(entry, description) {
        const { error } = await this.endInProgress(entry);
        if (error) {
        }
        else {
            this.startTimer(description);
        }
    }

    static async startTimerWithDescription(info) {
        const decription = info && info.selectionText ? info.selectionText : '';
        const { entry, error } = await this.getEntryInProgress();
        if (entry) {
            const { error } = await this.endInProgress(entry);
            if (error) {
                if (error.status === 400)
                    localStorage.setItem('integrationAlert', error.message + 'startTimerWithDescription');
                    // alert(error.message + 'startTimerWithDescription')
            }
            else {
                this.startTimer(decription);
            }
        }
        else {
            // if (error)  what about error ?
            this.startTimer(decription);
        }   
    }
    

    static async startTimer(
        description, 
        options = { 
            projectId: null, task: null, billable: null, tags: [], start: null, end: null, isSubmitTime: false, customFields: []
        },
        isPomodoro=false)
    {
        const { forceProjects, forceTasks } = await this.getForces();
        let { projectId, task, billable, tags, start, end, isSubmitTime, customFields } = options;
        if (!isPomodoro) {
            if (!projectId || forceTasks && !task) {
                const { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
                if (projectDB) {
                    projectId = projectDB.id;
                    if (billable === null)
                        billable = projectDB.billable;
                    if (taskDB) {
                        task = taskDB;
                    }
                }
                else {
                    projectId = null;
                    task = null;
                }
                
            }
        }
        const endPoint = `${await this.getUrlTimeEntries()}/full`;
        const body = { 
            start: start??new Date(),
            end: end??null,
            description,
            billable,
            projectId,
            tagIds: tags ? tags.map(tag => tag.id): [],
            taskId: task ? task.id : null,
            customFields
        }
        // console.log('StartTimer body', body)
        const { data: entry, error, status } = await this.apiCall(endPoint, 'POST', body);
        if (error) {
            console.error('oh no, failed', error);
        }
        else if (entry && !entry.message && !isSubmitTime) {
            // window.inProgress = true;
            aBrowser.action.setIcon({
                path: iconPathStarted
            });
            setTimeEntryInProgress(entry); 
            
            aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STARTED'});
            
            afterStartTimer(); // idle, pomodoro ...
        }

        return { entry, error, status }
    }


    static async startTimerOnStartingBrowser() {
        const userId = await this.userId;
        const str = await localStorage.getItem('permanent_autoStartOnBrowserStart');
        const autoStartForCurrentUserEnabled = str
            ? JSON.parse(str).find(autoStart =>
                    autoStart.userId === userId &&
                    autoStart.enabled)
            : false;
    
        if (autoStartForCurrentUserEnabled) {
            const { entry, error } = await this.getEntryInProgress();
            if (!entry && !error) {
                this.startTimer('');
            }
        }
    }
 
    static async endInProgressOnClosingBrowser() {
        const userId = await this.userId;
        const str = await localStorage.getItem('permanent_autoStopOnBrowserClose');
        const list = str ? JSON.parse(str) : [];
        const autoStopForCurrentUserEnabled = list.find(autoStop => 
                autoStop.userId === userId &&
                autoStop.enabled);
    
        if (autoStopForCurrentUserEnabled) {
            const { entry, error, status } = await this.getEntryInProgress();
            if (error) {
            }
            else if (entry) {
                this.endTimeEntryInProgress(entry);
            }
        }
    }


    static async endTimeEntryInProgress(timeEntry) {
        const { error } = await this.endInProgress(timeEntry);
        if (error && error.status === 400) {
            const endTime = new Date();
            this.saveEntryOfflineAndStopItByDeletingIt(timeEntry, endTime);
        }
    }
    

    static async updateProjectTask(timeEntry, projectDB, taskDB) {
        if (await isNavigatorOffline())
            return null;

        if (taskDB) {
            const endPoint = `${await this.getUrlTimeEntries()}/${timeEntry.id}/projectAndTask`;
            const body = {
                projectId: projectDB.id,
                taskId: taskDB.id
            };
            const { data:entry, error } = await this.apiCall(endPoint, 'PUT', body);
            if (error) {
                console.error('oh no, failed', error);
                return null;
            }
            this.updateBillable(entry.id, projectDB.billable); // no need for await
            return Object.assign(entry, { 
                        billable: projectDB.billable,
                        project: entry.project ? entry.project : projectDB,
                        task: entry.task ? entry.task : taskDB
                    });
        }
        else {
            const endPoint = `${await this.getUrlTimeEntries()}/${timeEntry.id}/project`;
            const body = {
                projectId: projectDB.id
            };
            const { data:entry, error } = await this.apiCall(endPoint, 'PUT', body);
            if (error) {
                console.error('oh no, failed', error);
                return null;
            }
            this.updateBillable(entry.id, projectDB.billable); // no need for await
            return Object.assign(entry, { 
                project: entry.project ? entry.project : projectDB,
                billable: projectDB.billable 
            });
        }
    }

    
    static async updateBillable(id, billable) {
        const endPoint = `${await this.getUrlTimeEntries()}/${id}/billable`;
        const body = {
            billable
        };
        const { data: entry, error, status } = await this.apiCall(endPoint, 'PUT', body);
        if (error) {
            console.error('oh no, failed', error);
        }
        return {entry, error, status}
    }

    static async deleteEntry(entryId, isWebSocketHeader) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}`;
        const { data:entry, error } = await this.apiCall(endPoint, 'DELETE');
        if (!error)
            setTimeEntryInProgress(null);
        return {entry, error}
    }

    static get timeEntryIdTemp() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    static async saveEntryOfflineAndStopItByDeletingIt(entry, end, isWebSocketHeader) {
        const timeEntry = {
            workspaceId: entry.workspaceId,
            id: this.timeEntryIdTemp,
            description: entry.description,
            projectId: entry.projectId,
            taskId: entry.task ? entry.task.id : null,
            billabe: entry.billable,
            timeInterval: {
                start: entry.timeInterval.start,
                end: new Date(end)
            }
        };

        const timeEntriesOffline = await localStorage.getItem('timeEntriesOffline') ?
            JSON.parse(await localStorage.getItem('timeEntriesOffline')) : [];  
        timeEntriesOffline.push(timeEntry);
        localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntriesOffline));  

        const {error} = await this.deleteEntry(entry.id, isWebSocketHeader);
        return {timeEntry, timeEntry}
    }

    static async (request) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return this.stopTimerAndStartNewEntry(request, sendResponse);
            } else {
                return this.startTimer(request, sendResponse);
            }
        })
        .catch((error) => {
            sendResponse(error)
        });
    }

    static async setDescription(entryId, description) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/description`;
        const body = {
            description
        };
        return await this.apiCall(endPoint, 'PUT', body);
    }

    static async updateProject(entryId, projectId) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/project`;
        const body = {
            projectId
        };
        return await this.apiCall(endPoint, 'PUT', body);
    }

    static async removeProject(entryId) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/project/remove`;
        return await this.apiCall(endPoint, 'DELETE');
    }


    static async updateTask(taskId, projectId, entryId) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/projectAndTask`;
        const body = {
            projectId,
            taskId
        };       
        return await this.apiCall(endPoint, 'PUT', body);
    }

    static async removeTask(entryId) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/task/remove`;
        return await this.apiCall(endPoint, 'DELETE');
    }

    static async updateTags(tagList, entryId) {
        const endPoint = `${await this.getUrlTimeEntries()}/${entryId}/tags`;
        const body = {
            tagIds: tagList
        };
        return await this.apiCall(endPoint, 'PUT', body);
    }


    static async integrationStartTimerWithDescription(description, timeEntryOptions) {
        let { projectName, projectId = null, taskName, taskId, tagNames, billable, start=null, end=null, isSubmitTime=false } = timeEntryOptions;
        let project = {id: projectId, name: projectName};
        let task = {id: taskId??null, name: taskName??null};
        const { forceDescription, forceProjects, forceTasks, forceTags } = await this.getForces();

        if (!!project.name) {
            const createObjects = await this.getCreateObjects();
            let { projectDB, taskDB, message } = 
                await ProjectService.getOrCreateProjectAndTask(project.name, task);
            if (projectDB) {
                project = projectDB;
            }
            else {
                if ((forceProjects || forceTasks && !taskDB) && !createObjects) {
                    message += "\n Integrations can't create projects/tasks. "
                }
            }
            task = taskDB;

            if (!billable) {
                billable = projectDB ? projectDB.billable : false;
            }
        }    
        let tags = null;
        if (tagNames && tagNames.length > 0) {
            const { tagovi, message: msg } = await TagService.getOrCreateTags(tagNames.map(tagName=>tagName.trim()));
            if (tagovi)
                tags = tagovi;
            if (msg)
                console.log('TagService', msg);
        }  
        else if (forceTags) {
            console.log("Tags are required!")
        }

        return await this.startTimer(
            description,
            { 
                projectId: project.id,
                task,
                billable,
                tags,
                start,
                end,
                isSubmitTime
            },
        );
    }

    /////////////////////////////////////////////////
    // for external extensions

    static async startNewEntryExternal(request) {
        let { description='', 
            project={id: null, name: null},
            task={id: null, name: null},
            billable,
            tags: tagNames=[]
        } = request;

        const { forceDescription, forceProjects, forceTasks, forceTags } = await this.getForces();
        
        if (forceDescription && !request.hasOwnProperty('description')) {
            return Promise.resolve({ 
                entry: {}, 
                message: `${clockifyLocales.DESCRIPTION_LABEL} ${clockifyLocales.REQUIRED}` 
            })
        }

        if (forceProjects) {
            if (!request.hasOwnProperty('project') || typeof project !== 'object')
                return Promise.resolve({ entry: {}, message: "Missing { project: { name: 'MyProject' } }" });
        }

        if (forceTasks) {
            if (!request.hasOwnProperty('task') || typeof task !== 'object')
                return Promise.resolve({ entry: {}, message: "Missing { task: { name: 'MyTask' } }" })
        }

        description = description.trim();
        if (!project.hasOwnProperty('name')) {
            project.name = "";
        }
        if (!task.hasOwnProperty('name')) {
            task.name = "";
        }
        project.name = project.name.trim();
        task.name = task.name.trim();

        let message = '';
        this.doAlert = false; // global

        const { entry, error } = await this.getEntryInProgress();
        if (entry) {
            const { error } = await this.endInProgress(entry);
            if (error) {
                this.doAlert = true;
                return Promise.resolve({ entry, message: error.message})
                //if (error.status === 400)
                //    alert(error.message + 'startTimerWithDescription')
            }
        }

        if (!!project.name) {
            const createObjects = await this.getCreateObjects();
            const { projectDB, taskDB, message: msg } = 
                await ProjectService.getOrCreateProjectAndTask(project.name, task);
            message += msg;
            if (projectDB) {
                project = projectDB;
            }
            else {
                if ((forceProjects || forceTasks && !taskDB) && !createObjects) {
                    message += "\n Integrations can't create projects/tasks. "
                }
            }
            task = taskDB;

            if (billable === null) {
                billable = projectDB ? projectDB.billable : false;
            }
        }

        if (forceDescription && description==='') {
            message += `\n ${clockifyLocales.DESCRIPTION_LABEL} ${clockifyLocales.REQUIRED}`;
        }

        if (forceProjects && (!project || !project.hasOwnProperty('id'))) {
            message += "\n Project (required) is not provided. ";
        }
        if (forceTasks && (!task || !task.hasOwnProperty('id'))) {
            message += "\n Task (required) is not provided. "
        }
        
        let tags = null;
        if (tagNames.length > 0) {
            const { tagovi, message: msg } = await TagService.getOrCreateTags(tagNames.map(tagName=>tagName.trim()));
            if (tagovi)
                tags = tagovi;
            if (msg)
                message += msg;
        }  
        else if (forceTags) {
            message += "Tags are required!"
        }

        const { entry: ent, error: err } = await this.startTimer(
            description,
            { 
                projectId: project.id,
                task,
                billable,
                tags
            }
        );

        this.doAlert = true; // global
        return Promise.resolve({ 
            entry: ent, 
            message: message + (err ? err.message : '') 
        });

    }

    static async endInProgressExternal() {
        this.doAlert = false; // global
        const { entry, error } = await this.endInProgress();
        this.doAlert = true; // global
        return Promise.resolve({ entry, error });
    }    
}


TimeEntry._doAlert = true;
