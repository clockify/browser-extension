class TimeEntry extends Service {

    constructor() {
    }

    static get doAlert() { return this._doAlert; }
    static set doAlert(b) { this._doAlert = b }

    static get urlTimeEntries() {
        return `${this.apiEndpoint}/workspaces/${this.workspaceId}/timeEntries`;
    }

    static async getEntryInProgress() {
        const endPoint = `${this.urlTimeEntries}/inProgress`;
        const { data: entry, error } = await this.apiCall(endPoint);
        if (error) { // entry instanceof Error) {
            console.error('oh no, failed', error);
        }
        return { entry, error }
    }
    
    static async getLastEntry() {
        const endPoint = `${this.apiEndpoint}/v1/workspaces/${this.workspaceId}/user/${this.userId}/time-entries?page-size=2`;
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


    static async endInProgress(timeEntry=null, end=new Date()) {
        if (timeEntry) {
            const {projectId, task} = timeEntry;
            const { forceProjects, forceTasks } = this.forces;
            if (!projectId || forceTasks && !task) {
                const { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
                if (projectDB) {
                    await this.updateProjectTask(timeEntry, projectDB, taskDB);
                }
            }
        }
        const endPoint = `${this.urlTimeEntries}/endStarted`;
        const body = { end }
        const { data: entry, error } = await this.apiCall(endPoint, 'PUT', body);
        if (error) {
            console.error('oh no, failed', error);
            if (error.status === 400) {
                console.log('endInProgress ' + error.message)
            }
        }
        else {
            aBrowser.browserAction.setIcon({ path: iconPathEnded });
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
        console.log(this)
        const { entry, error } = await this.getEntryInProgress();
        if (entry) {
            const { error } = await this.endInProgress(entry);
            if (error) {
                if (error.status === 400)
                    alert(error.message + 'startTimerWithDescription')
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
            projectId: null, task: null, billable: false, tags: []
        },
        isPomodoro=false)
    {
        const { forceProjects, forceTasks } = this.forces;
        let { projectId, task, billable, tags} = options;
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
        const endPoint = `${this.urlTimeEntries}/`;
        const body = { 
            start: new Date(),
            description,
            billable,
            projectId,
            tagIds: tags ? tags.map(tag => tag.id): [],
            taskId: task ? task.id : null
        }
        const { data: entry, error } = await this.apiCall(endPoint, 'POST', body);
        if (error) {
            console.error('oh no, failed', error);
        }
        else if (entry && !entry.message) {
            window.inProgress = true;
            aBrowser.browserAction.setIcon({
                path: iconPathStarted
            });
            setTimeEntryInProgress(entry);
            aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STARTED'}); // ?
            afterStartTimer(); // idle, pomodoro ...
        }

        return { entry, error }
    }


    static async startTimerOnStartingBrowser() {
        const userId = this.userId;
        const str = localStorage.getItem('permanent_autoStartOnBrowserStart');
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
        const userId = this.userId;
        const str = localStorage.getItem('permanent_autoStopOnBrowserClose');
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
        if (isNavigatorOffline())
            return null;

        if (taskDB) {
            const endPoint = `${this.urlTimeEntries}/${timeEntry.id}/projectAndTask`;
            const body = {
                projectId: projectDB.id,
                taskId: taskDB.id
            };
            const { data:entry, error } = await this.apiCall(endPoint, 'PUT', body);
            if (error) {
                console.error('oh no, failed', error);
                return null;
            }
            this.updateBillable(entry, projectDB.billable); // no need for await
            return Object.assign(entry, { 
                        billable: projectDB.billable,
                        project: entry.project ? entry.project : projectDB,
                        task: entry.task ? entry.task : taskDB
                    });
        }
        else {
            const endPoint = `${this.urlTimeEntries}/${timeEntry.id}/project`;
            const body = {
                projectId: projectDB.id
            };
            const { data:entry, error } = await this.apiCall(endPoint, 'PUT', body);
            if (error) {
                console.error('oh no, failed', error);
                return null;
            }
            this.updateBillable(entry, projectDB.billable); // no need for await
            return Object.assign(entry, { 
                project: entry.project ? entry.project : projectDB,
                billable: projectDB.billable 
            });
        }
    }

    
    static async updateBillable(timeEntry, billable) {
        const endPoint = `${this.urlTimeEntries}/${timeEntry.id}/billable`;
        const body = {
            billable
        };
        const { data: entry, error } = await this.apiCall(endPoint, 'PUT', body);
        if (error) {
            console.error('oh no, failed', error);
        }
        return {entry, error}
    }

    static async deleteEntry(entryId, isWebSocketHeader) {
        const endPoint = `${this.urlTimeEntries}/${entryId}`;
        const { data:entry, error } = await this.apiCall(endPoint, 'DELETE');
        if (!error)
            setTimeEntryInProgress(null);
        return {entry, error}
    }


    static async saveEntryOfflineAndStopItByDeletingIt(entry, end, isWebSocketHeader) {
        const timeEntry = {
            workspaceId: entry.workspaceId,
            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            description: entry.description,
            projectId: entry.projectId,
            taskId: entry.task ? entry.task.id : null,
            billabe: entry.billable,
            timeInterval: {
                start: entry.timeInterval.start,
                end: new Date(end)
            }
        };

        const timeEntriesOffline = localStorage.getItem('timeEntriesOffline') ?
            JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];  
        timeEntriesOffline.push(timeEntry);
        localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntriesOffline));  

        const {error} = await this.deleteEntry(entry.id, isWebSocketHeader);
        return {timeEntry, timeEntry}
    }

    static async healthCheck() {
        const endPoint = `${this.apiEndpoint}/health`;
        const { data, error } = await this.apiCall(endPoint);
        return !error;
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

    /////////////////////////////////////////////////
    // for external extensions

    static async startNewEntryExternal(request) {
        let { description='', 
            project={id: null, name: null},
            task={id: null, name: null},
            billable,
            tags: tagNames=[]
        } = request;

        console.log({request})
        const { forceDescription, forceProjects, forceTasks, forceTags } = this.forces;
        
        if (forceDescription && !request.hasOwnProperty('description')) {
            return Promise.resolve({ entry: {}, message: "Description is missing!" })
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
            const { projectDB, taskDB, message: msg } = 
                await ProjectService.getOrCreateProjectAndTask(project.name, task);
            message += msg;
            if (projectDB) {
                project = projectDB;
            }
            else {
                if ((forceProjects || forceTasks && !taskDB) && !this.createObjects) {
                    message += "\n Integrations can't create projects/tasks. "
                }
            }
            task = taskDB;

            if (billable === null) {
                billable = projectDB ? projectDB.billable : false;
            }
        }

        if (forceDescription && description==='') {
            message += "\n Description is required. ";
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
