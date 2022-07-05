class ClockifyIntegrationBase {

    constructor() {
    }

    // static async get wsSettings() {
    //     const wsSettings = await localStorage.getItem("workspaceSettings");
    //     return wsSettings ? JSON.parse(wsSettings) : null;
    // }

    // static get isSpecialFilter() {
    //     return this.wsSettings ? this.wsSettings.projectPickerSpecialFilter : false;
    // }

    
    static async takeTimeEntryInProgress(sendResponse) {      
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }
        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (!entry || error) {
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
        sendResponse({ status: clockifyLocales.OK_BTN })
    }


    static async stopEntryInProgress(sendResponse) {      
        if (await isNavigatorOffline()) {
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
            aBrowser.action.setIcon({
                path: iconPathEnded
            });
            sendResponse({ status: clockifyLocales.OK_BTN })
        }
    }

    static async startWithDescription({timeEntryOptions}, sendResponse) {
        if (await isNavigatorOffline()) {
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
                // window.inProgress = true;
                aBrowser.action.setIcon({
                    path: iconPathStarted
                });
                addPomodoroTimer();
                // localStorage.setItem('timeEntryInProgress', JSON.stringify(ent));
                aBrowser.storage.local.set({'timeEntryInProgress': ent});
            }   
            sendResponse({ status: status, data: ent });
        }
    }

                                   
    static async generateManualEntryData({projectName, taskName, tagNames}, sendResponse){
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }
        let project, task, tags;
        if(projectName) {
            let { projectDB } = await ProjectService.getOrCreateProject(projectName);
            project = projectDB;

            if(project && taskName){
                let { taskDB } = await ProjectService.getOrCreateProjectAndTask(project.name, {name : taskName});
                task = taskDB;
            }
        }

        if(tagNames){
            const { tagovi } = await TagService.getOrCreateTags(tagNames.map(tagName=>tagName.trim()));
            tags = tagovi;
        }

        sendResponse({project, task, tags})
    }

    static async getProjectsByIds({ projectIds, taskIds }, sendResponse) {
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({projectDB: null , taskDB: null, msg: (error.message ? error.message : error.status)}  )
            return;
        }
        const { projectDB, error : projectError, status } = await ProjectService.getProjectsByIds(projectIds, taskIds);
        if (projectError) {
            sendResponse(projectError.message ? projectError.message : projectError.status)
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


    static async getDefaultProjectTask(sendResponse) {
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({projectDB: null , taskDB: null, msg: (error.message ? error.message : error.status)}  )
            return;
        }

        const { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
        sendResponse({projectDB, taskDB, msg, msgId});
               
    } 

    static async getProjects({filter, page, pageSize, forceTasks, alreadyIds}, sendResponse) {
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({ status: err.status})
            return;
        }

        let projectList = [];
        const { data: projects, error : projectsError } = await ProjectService.getProjectsWithFilter(filter, page, pageSize, forceTasks, alreadyIds);
        if (projectsError) {
            sendResponse(projectsError.message ? projectsError.message : projectsError.status) 
        }
        sendResponse({
            status: 201,
            data: {
                projectList: projectList.concat(projects)
            }
        })
    }

    static async getProjectTasks({projectId, filter, page}, sendResponse) {
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse({projectDB: null , taskDB: null, msg: (error.message ? error.message : error.status)}  )
            return;
        }

            const { data , status } = await ProjectService.getProjectTasksWithFilter(projectId, filter, page);
            sendResponse ({
                status,
                data: {
                    taskList: data,
                }
            })
    }        
    
    static async submitDescription({ id, description }, sendResponse) {
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

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

    static async editTask({ id, project, task }, sendResponse) {
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        const { data: pageTags, error: tagsError, status } = await TagService.getAllTagsWithFilter(page, pageSize, filter);
        if (tagsError) {
            sendResponse(tagsError.message ? tagsError.message : tagsError.status);
            return;
        }
        sendResponse({ status, pageTags });
                
    }

    static async editTags({ id, tagIds }, sendResponse) {
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
            sendResponse('Connection is offline');
            return;
        }

        const hydrated = true;
        const { entry, error } = await TimeEntry.getEntryInProgress(hydrated);
        if (error) {
            sendResponse(error.message ? error.message : error.status)
            return;
        }

        sendResponse({ entry });
    }

    static async removeProjectAsFavorite({ projectId }, sendResponse) {
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
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
            const response = await CustomFieldService.getWSCustomField(name);
            if(response){
                const { data, error, status } = response;
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
            } else {
                sendResponse('Connection is offline', 0);
            }
        //}
        //else {
        //    sendResponse('There is no TimeEntry in progress', 0)
        //}        
    }


    static async getUserRoles({ }, sendResponse) {
        if (await isNavigatorOffline()) {
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
        if (await isNavigatorOffline()) {
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

    static generateManualEntryData(request, sendResponse){
        if(isChrome()){
            super.generateManualEntryData(request.options, sendResponse);
            return true;
        } else {
            return new Promise(resolve => {
                super.generateManualEntryData(request.options, resolve);
            })
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