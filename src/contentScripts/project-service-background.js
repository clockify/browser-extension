class ProjectService extends ClockifyService {

    constructor() {
    }

    static async wsSettings() {
        const wsSettings = await localStorage.getItem("workspaceSettings");
        return wsSettings ? JSON.parse(wsSettings) : null;
    }

    static async getProjectFavorites() {
        const wsSettings = await this.wsSettings();
        return wsSettings ? wsSettings.projectFavorites : true;
    }


    static async getUrlProjects() {
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        return `${apiEndpoint}/workspaces/${workspaceId}/projects`;
    }

    static async getOrCreateProjectAndTask(projectName, task) {
        const {forceTasks} = await this.getForces();
        let {
            projectDB, taskDB, msg,
            found, created, onlyAdminsCanCreateProjects, projectArchived
        } = await this.getOrCreateProject(projectName);
    
        let message = msg ? msg : ''; 
        if (projectArchived) {
            message += projectName + " is archived.";
        }
        if (onlyAdminsCanCreateProjects) {
            message += "Only Admins can create projects.";
        }
    
        if (projectDB) {
            if (found || created) {
                if (task && task.name) {
                    const taskName = task.name.trim().replace(/\s+/g, ' '); // /\s\s+/g
                    const { task: t, error } = await TaskService.getOrCreateTask(projectDB, taskName);
                    if (error)
                        message += error.message;
                    taskDB = t;
                }
                if (forceTasks && !taskDB) {
                    // has project, but not able to create another task, so take DefaultProjectTask
                    const { projectDB: p, taskDB: t, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
                    if (msg) {
                       console.log(msg);
                       message += ' ' + msg;
                    }
                    if (p) // keep project, if there is no task
                        projectDB = p;
                    taskDB = t;
                }                
            }
        }
        return { projectDB, taskDB, message };
    }

    static async getOrCreateProject(projectName) {
        const page = 0;
        const pageSize = 50;
        let projectFilter;
        const { projectPickerSpecialFilter } = await this.getForces();

        let project;
        projectName = projectName.trim().replace(/\s+/g, ' ');
        if (projectPickerSpecialFilter) {
            // cekamo project-picker tim da vidi sta ce sa '@' unutar naziva projekta ili taska
            projectFilter = '@' + projectName; // don't encode twice encodeURIComponent(projectName);  
        } else {
            projectFilter = projectName;
        }
        const { projects, error } = await this.getProjectWithFilter(projectFilter, page, pageSize);
        if (error) {
            return { projectDB: null, error };
        }
        else {
            if (projects && projects.length > 0) {
                project = projects.find(p => p.name === projectName);
            }
        }

        let onlyAdminsCanCreateProjects = false;
        let projectArchived = false;
        const createObjects = await this.getCreateObjects();
        const canCreateProject = await this.getCanCreateProjects();
        if (project) {
            if (!project.archived)
                return { projectDB: project, found: true };
            projectArchived = true;
        }
        else if (createObjects) {
            //get default billable property from workspace settings
            let wsSettings = await this.wsSettings();
            const requestBody = { name: projectName }
            if( wsSettings?.defaultBillableProjects !== undefined && wsSettings?.defaultBillableProjects !== null ){
                requestBody.billable = wsSettings.defaultBillableProjects;
            };

            const { data: project, error, status } = await this.createProject(requestBody);
            if (status === 201) {
                return { projectDB: project, created: true };
            }
            if (error && error.status === 403) {
                onlyAdminsCanCreateProjects = true;
            }
        }
        const { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB();
        if (msg) {
           console.log(msg);
        }        

        return { projectDB, taskDB, msg, msgId, projectArchived, onlyAdminsCanCreateProjects };
    }

    static async getProjectWithFilter(filter, page, pageSize) {
        const filterTrimmedEncoded = encodeURIComponent(filter.trim())
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects?page=${page}&search=${filterTrimmedEncoded}`;  // &favorites
        const { data: projects, error } = await this.apiCall(endPoint);
        return { projects, error };
    }

    static async createProject(bodyProject) {
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/v1/workspaces/${workspaceId}/projects`;
        return await this.apiCall(endPoint, 'POST', bodyProject);
    }

    static async getLastUsedProjectFromTimeEntries(forceTasks) { 
        const urlProjects = await this.getUrlProjects();
        const endPoint = `${urlProjects}/lastUsed?type=PROJECT${forceTasks?'_AND_TASK':''}`;
        const { data, error, status } = await this.apiCall(endPoint);
        if (status === 200 && data)
            return { 
                projectDB: forceTasks ? data.project : data,
                taskDB: forceTasks ? data.task : null
            }
        else
            return { 
                projectDB: null, 
                taskDB: null
            };
    }

    static async getProjectsByIds(projectIds, taskIds) {
        const urlProjects = await this.getUrlProjects();
        const endPoint = `${urlProjects}/ids`;
        const body = { ids: projectIds };
        const { data: projects, error, status } = await this.apiCall(endPoint, 'POST', body);
        if (error) {
            return { error }
        }
        if (status === 200 && projects.length > 0) {
            const projectDB = projects[0];
            if (taskIds) {
                const { tasks, error: err, status: st } = await this.getAllTasks(taskIds);
                if (err) {
                }
                else {
                    projectDB.tasks = [tasks[0]]
                }
            }
            return { projectDB, error, status };
        }
        else {
            return { projectDB: null, error, status};
        }
    }

    static async getAllTasks(taskIds) {
        const urlProjects = await this.getUrlProjects();
        const endPoint = `${urlProjects}/taskIds`;
        const body = {
            ids: taskIds
        };
        const { data: tasks, error, status } = await this.apiCall(endPoint, 'POST', body);
        return { tasks, error, status };
    }

    
    static async getProjectsWithFilter(filter, page, pageSize, forceTasks=false, alreadyIds=[]) {
        const filterTrimmedEncoded = encodeURIComponent(filter.trim())
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        //const projectUrl = `${this.apiEndpoint}/workspaces/${this.workspaceId}/project-picker/projects?search=${filterTrimmedEncoded}`;  // &favorites
        const projectUrlFavs = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects?search=${filterTrimmedEncoded}`;
        const projectUrlNonFavs = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects?favorites=false&clientId=&excludedTasks=&search=${filterTrimmedEncoded}&userId=`;
        const projectFavorites = await this.getProjectFavorites();
        if (projectFavorites) {
            const { data, error } = await this.dopuniFavs(alreadyIds, projectUrlFavs, [], 1, pageSize, forceTasks) // always go page:1
            if (error) {
                return { data, error }
            }

            if (data.length >= pageSize) {
                return {data};
            }
            // alreadyIds.concat(data.map(p => p.id)
            return await this.dopuniNonFavorites(alreadyIds, projectUrlNonFavs, data, page, pageSize, forceTasks) // always go page:1
        }
        else {
            return await this.dopuniPage(alreadyIds, projectUrlNonFavs, [], page, pageSize, forceTasks) // always go page:1
        }
    }  

    static async dopuniFavs(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        let endPoint = `${projectUrl}&page=${page}&pageSize=${pageSize}&favorites=true`;  // 
        const { data: projects, error } = await this.apiCall(endPoint);
        if (error)
            return { data: projects, error };

        projects.forEach(project => {
            if (!alreadyIds.includes(project.id) &&
                data.length < pageSize &&
                (!forceTasks || project.taskCount > 0)) 
                    data.push(project);
        });
        return { data, error };
    }

    static async dopuniNonFavorites(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        let endPoint = `${projectUrl}&pageSize=${pageSize}&page=${page}`;  // &favorites=false
        const { data:projects, error } = await this.apiCall(endPoint);
        if (error)
            return { data: projects, error };
        projects.forEach(project => {
            if (!project.favorite &&
                !alreadyIds.includes(project.id) &&
                data.length < pageSize &&
                (!forceTasks || project.taskCount > 0)) 
                data.push(project);
        });
        if (projects.length < pageSize || data.length >= pageSize) {
            return { data, error };
        }
        return await this.dopuniNonFavorites(alreadyIds, projectUrl, data, page+1, pageSize, forceTasks);
    }

    static async dopuniPage(alreadyIds, projectUrl, data, page, pageSize, forceTasks) {
        let endPoint = `${projectUrl}&page=${page}`;  // &favorites=false
        const { data:projects, error } = await this.apiCall(endPoint);
        if (error)
            return { data: projects, error };
        projects.forEach(project => {
            if (!alreadyIds.includes(project.id) &&
                data.length < pageSize &&
                (!forceTasks || project.taskCount > 0)) 
                data.push(project);
        });
        if (projects.length < pageSize || data.length >= pageSize) {
            return { data, error };
        }
        return await this.dopuniPage(alreadyIds, projectUrl, data, page+1, pageSize, forceTasks)
    }

    static async getProjectTasksWithFilter(projectId, filter, page) {
        const filterTrimmedEncoded = encodeURIComponent(filter.trim())
        const apiEndpoint = await this.apiEndpoint;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/project-picker/projects/${projectId}/tasks?page=${page}&search=${filterTrimmedEncoded}`;  // &favorites
        return await this.apiCall(endPoint);
    }

    static async makeProjectFavorite(projectId) {
        const apiEndpoint = await this.apiEndpoint;
        const userId = await this.userId;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/users/${userId}/projects/favorites/${projectId}`;
        const body = {};
        return await this.apiCall(endPoint, 'POST', body);
    }

    static async removeProjectAsFavorite(projectId) {
        const apiEndpoint = await this.apiEndpoint;
        const userId = await this.userId;
        const workspaceId = await this.workspaceId;
        const endPoint = `${apiEndpoint}/workspaces/${workspaceId}/users/${userId}/projects/favorites/projects/${projectId}`;
        return await this.apiCall(endPoint, 'DELETE');
    }

}