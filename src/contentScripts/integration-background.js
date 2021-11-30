class ClockifyIntegrationBase {

    constructor() {
    }

    static get wsSettings() {
        const wsSettings = localStorage.getItem("workspaceSettings");
        return wsSettings ? JSON.parse(wsSettings) : null;
    }

    static get isSpecialFilter() {
        return this.wsSettings ? this.wsSettings.projectPickerSpecialFilter : false;
    }

    
    static async takeTimeEntryInProgress(sendResponse) {      
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }
        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (!entry || error) {
            setTimeEntryInProgress(null);
            aBrowser.browserAction.setIcon({
                path: iconPathEnded
            });
        }
        else {
            setTimeEntryInProgress(entry);
            aBrowser.browserAction.setIcon({
                path: iconPathStarted
            });
        }
        sendResponse({ status: 'OK' })
    }


    static async stopEntryInProgress(sendResponse) {      
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }
        const { error } = await TimeEntry.endInProgress();
        if (error) {
            sendResponse({ status: error.status });
        }
        else {
            aBrowser.notifications.clear('idleDetection');
            restartPomodoro();
            aBrowser.browserAction.setIcon({
                path: iconPathEnded
            });
            sendResponse({ status: 'OK' })
        }
    }

    static async startWithDescription({timeEntryOptions}, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({ status: error.status})
            return;
        }

        if (entry) {
            const { error } = await TimeEntry.endInProgress();
            if (error) {
                sendResponse({ status: error.status})
                return;
            }
        }
        
        const {entry: ent, error: err, status} = 
            await TimeEntry.integrationStartTimerWithDescription(timeEntryOptions.description, timeEntryOptions);
        if (err) {
            sendResponse({ status: err.status });
        }
        else {
            if (status === 201) {
                // proveri afterStartTimer
                window.inProgress = true;
                aBrowser.browserAction.setIcon({
                    path: iconPathStarted
                });
                addPomodoroTimer();
            }   
            sendResponse({ status: status, data: ent });
        }
    }
    

    static async getProjectsByIds({ projectIds, taskIds }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({projectDB: null , taskDB: null, msg: (error.message ? error.message : error.status)}  )
            return;
        }

        if (entry) {
            const { projectDB, error, status } = await ProjectService.getProjectsByIds(projectIds, taskIds);
            if (error) {
                sendResponse(error.message ? error.message : error.status)
                return;
            }
            if (projectDB) {
                sendResponse({
                    status,
                    data: [projectDB]
                })
            }
            else {
                sendResponse({
                    status,
                    data: []
                })
            }
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }     


    static async getDefaultProjectTask(sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({projectDB: null , taskDB: null, msg: (error.message ? error.message : error.status)}  )
            return;
        }

        if (entry) {
            const { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
            sendResponse({projectDB, taskDB, msg, msgId});
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    } 

    static async getProjects({filter, page, pageSize, forceTasks, alreadyIds}, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({ status: err.status})
            return;
        }

        if (entry) {
            let projectList = [];
            const { data: projects, error } = await ProjectService.getProjectsWithFilter(filter, page, pageSize, forceTasks, alreadyIds);
            if (error) {
                sendResponse(error.message ? error.message : error.status) 
            }
            sendResponse({
                status: 201,
                data: {
                    projectList: projectList.concat(projects)
                }
            })
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }

    static async getProjectTasks({projectId, filter, page}, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({projectDB: null , taskDB: null, msg: (error.message ? error.message : error.status)}  )
            return;
        }

        if (entry) {
            const { data, error, status } = await ProjectService.getProjectTasksWithFilter(projectId, filter, page);
            sendResponse ({
                status,
                data: {
                    taskList: data,
                }
            })
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }        
    
    static async submitDescription({ id, description }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            const {data: timeEntry, error, status} = await TimeEntry.setDescription(id, description.trim())
            if (error) {
                sendResponse(error.message ? error.message : error.status)
                return;
            }
            sendResponse({ data: timeEntry, status});
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }

    static async editProject({ id, project }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            if (!project.id) {
                const {data: entry, error, status} = await TimeEntry.removeProject(id);
                if (error) {
                    sendResponse(error.message ? error.message : error.status);
                    return;
                }
                sendResponse({ status, entry });
            } 
            else {
                const {data: entry, error, status} = await TimeEntry.updateProject(id, project.id);
                if (error) {
                    sendResponse(error.message ? error.message : error.status);
                    return;
                }
                sendResponse({ status, entry });
            }
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }    

    static async editTask({ id, project, task }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            if (!task) {
                const {data: entry, error, status} = await TimeEntry.removeTask(id);
                if (error) {
                    sendResponse(error.message ? error.message : error.status);
                    return;
                }
                sendResponse({ status, entry });
            } 
            else {
                const {data: entry, error, status} = await TimeEntry.updateTask(task.id, project.id, id);
                if (error) {
                    sendResponse(error.message ? error.message : error.status);
                    return;
                }
                sendResponse({ status, entry });
            }
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }

    static async getTags({ filter, page, pageSize}, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            const { data: pageTags, error, status } = await TagService.getAllTagsWithFilter(page, pageSize, filter);
            if (error) {
                sendResponse(error.message ? error.message : error.status);
                return;
            }
            sendResponse({ status, pageTags });
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }

    static async editTags({ id, tagIds }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            const { data: timeEntry, error, status }  = await TimeEntry.updateTags(tagIds, id)
            if (error) {
                sendResponse(error.message ? error.message : error.status);
                return;
            }
            sendResponse({ status, timeEntry });
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }

    
    static async fetchEntryInProgress(sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const hydrated = true;
        const { entry, error } = await TimeEntry.getEntryInProgress(hydrated);
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        sendResponse({ status, entry });
    }

    static async removeProjectAsFavorite({ projectId }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            const { error, status }  = await ProjectService.removeProjectAsFavorite(projectId);
            if (error) {
                sendResponse(error.message ? error.message : error.status);
                return;
            }
            sendResponse({ status });
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }
    }

    static async makeProjectFavorite({ projectId }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            const { error, status }  = await ProjectService.makeProjectFavorite(projectId);
            if (error) {
                sendResponse(error.message ? error.message : error.status);
                return;
            }
            sendResponse({ status });
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }

    static async editBillable({ id, billable }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        if (entry) {
            const { entry, error, status }  = await TimeEntry.updateBillable(id, billable);
            if (error) {
                sendResponse(error.message ? error.message : error.status);
                return;
            }
            sendResponse({ entry, status });
        }
        else {
            sendResponse('There is no TimeEntry in progress')
        }        
    }


    static async submitTime({ totalMins, timeEntryOptions }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({ status: error.status})
            return;
        }

        if (entry) {
            const { error } = await TimeEntry.endInProgress();
            if (error) {
                sendResponse({ status: error.status, endInProgressStatus: true})
                return;
            }
        }

        const end = new Date();
        timeEntryOptions.start = new Date(end.getTime() - totalMins * 60000);
        timeEntryOptions.end = end;
        timeEntryOptions.isSubmitTime = true;

        const { entry: ent, error: err, status } = 
            await TimeEntry.integrationStartTimerWithDescription(timeEntryOptions.description, timeEntryOptions);
        if (err) {
            if (err.status && err.status === 400)  {
                sendResponse({ entry: ent, status: 400 });
            }
            else {
                sendResponse(err.message ? err.message : err.status);
            }
            return;
        }
        sendResponse({ entry: ent, status });
    }


    static async getWSCustomField({ name }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline', 0);
            return;
        }

        // const { entry, error } = await TimeEntry.getEntryInProgress();
        // if (error) {
        //     sendResponse(error.message, error.status)
        //     return;
        // }

        //if (entry) {
            // const {data: timeEntry, error, status} = await TimeEntry.setDescription(id, description.trim())
            const { data, error, status } = await CustomFieldService.getWSCustomField(name);
            // if (status === 201) {
            //     //tags.push(tag);
            // }
            // else {
            //     message += `\nCouldn't create tag: ${tagName}`;
            // }

            if (error) {
                sendResponse(error.message, error.status)
                return;
            }
            sendResponse({ data, status });
        //}
        //else {
        //    sendResponse('There is no TimeEntry in progress', 0)
        //}        
    }


    static async getUserRoles({ }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline', 0);
            return;
        }
        // const {data: timeEntry, error, status} = await TimeEntry.setDescription(id, description.trim())
        const { data, error, status } = await UserService.getUserRoles();
        // if (status === 201) {
        //     //tags.push(tag);
        // }
        // else {
        //     message += `\nCouldn't create tag: ${tagName}`;
        // }

        if (error) {
            sendResponse(error.message, error.status)
            return;
        }
        sendResponse({ data, status });
    }    

    static async submitCustomField({ timeEntryId, customFieldId, value }, sendResponse) {
        if (isNavigatorOffline()) {
            sendResponse('Connection is offline', 0);
            return;
        }

        // we can edit some TimeEntry in EditForm, without TimeEntry in progress
        // const { entry, error } = await TimeEntry.getEntryInProgress();
        // if (error) {
        //     sendResponse(error.message, error.status);
        //     return;
        // }

        //if (entry) {
            const { data, error, status } = await CustomFieldService.updateCustomField(
                timeEntryId,
                customFieldId,
                value
            );
            if (error) {
                sendResponse(error.message, error.status);
                return;
            }
            sendResponse({ data, status });
        //}
        //else {
        //    sendResponse('There is no TimeEntry in progress', 0)
        //}        
    }    
}


class ClockifyIntegration extends ClockifyIntegrationBase {

    constructor() {
    }

    
    static takeTimeEntryInProgress(sendResponse) {
        if (isChrome()) {
            super.takeTimeEntryInProgress(sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.takeTimeEntryInProgress(resolve);
            });
        }
    }
   
    static stopEntryInProgress(sendResponse) {
        if (isChrome()) {
            super.stopEntryInProgress(sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.stopEntryInProgress(resolve);
            });
        }
    }

    static startWithDescription(request, sendResponse) {
        if (isChrome()) {
            super.startWithDescription(request, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.startWithDescription(request, resolve);
            });
        }
    }

    
    static getProjectsByIds(request, sendResponse) {
        if (isChrome()) {
            super.getProjectsByIds(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getProjectsByIds(request.options, resolve);
            });
        }
    }

    
    static getDefaultProjectTask(sendResponse) {
        if (isChrome()) {
            super.getDefaultProjectTask(sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getDefaultProjectTask(resolve);
            });
        }
    }

    static getProjects(request, sendResponse) {
        if (isChrome()) {
            super.getProjects(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getProjects(request.options, resolve);
            });
        }
    }

    static getProjectTasks(request, sendResponse) {
        if (isChrome()) {
            super.getProjectTasks(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getProjectTasks(request.options, resolve);
            });
        }
    }

    
    static submitDescription(request, sendResponse) {
        if (isChrome()) {
            super.submitDescription(request.timeEntryOptions, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.submitDescription(request.timeEntryOptions, resolve);
            });
        }
    }

    static editProject(request, sendResponse) {
        if (isChrome()) {
            super.editProject(request.timeEntryOptions, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.editProject(request.timeEntryOptions, resolve);
            });
        }
    }

    static editTask(request, sendResponse) {
        if (isChrome()) {
            super.editTask(request.timeEntryOptions, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.editTask(request.timeEntryOptions, resolve);
            });
        }
    }
    
    static getTags(request, sendResponse) {
        if (isChrome()) {
            super.getTags(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getTags(request.options, resolve);
            });
        }
    }    

    static editTags(request, sendResponse) {
        if (isChrome()) {
            super.editTags(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.editTags(request.options, resolve);
            });
        }
    }    

    
    static fetchEntryInProgress(sendResponse) {
        if (isChrome()) {
            super.fetchEntryInProgress(sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.fetchEntryInProgress(resolve);
            });
        }
    }    

    static removeProjectAsFavorite(request, sendResponse) {
        if (isChrome()) {
            super.removeProjectAsFavorite(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.removeProjectAsFavorite(request.options, resolve);
            });
        }
    }

    static makeProjectFavorite(request, sendResponse) {
        if (isChrome()) {
            super.makeProjectFavorite(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.makeProjectFavorite(request.options, resolve);
            });
        }
    }        
    
    static editBillable(request, sendResponse) {
        if (isChrome()) {
            super.editBillable(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.editBillable(request.options, resolve);
            });
        }
    }

    static submitTime(request, sendResponse) {
        if (isChrome()) {
            super.submitTime(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.submitTime(request.options, resolve);
            });
        }
    }

    static getWSCustomField(request, sendResponse) {
        if (isChrome()) {
            super.getWSCustomField(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getWSCustomField(request.options, resolve);
            });
        }
    }

        
    static getUserRoles(request, sendResponse) {
        if (isChrome()) {
            super.getUserRoles(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.getUserRoles(request.options, resolve);
            });
        }
    }

    static submitCustomField(request, sendResponse) {
        if (isChrome()) {
            super.submitCustomField(request.options, sendResponse);
            return true;
        }
        else {
            return new Promise(resolve => {
                super.submitCustomField(request.options, resolve);
            });
        }
    }

 }