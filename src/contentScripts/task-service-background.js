class TaskService extends ClockifyService {

    constructor() {
    }

    static get urlProjects() {
        return `${this.apiEndpoint}/workspaces/${this.workspaceId}/projects`;
    }

    static async getTask(taskId) {
        const endPoint = `${this.urlProjects}/taskIds`;
        const body = { ids: [taskId] }
        const { data: tasks, error, status } = await this.apiCall(endPoint, 'POST', body);
        if (status === 200 && tasks.length > 0) { 
            return tasks[0];
        } 
        return null;
    }    

    static async getOrCreateTask(project, taskName) {
        // try to find the appropriate task for this
        // if project.tasks is not present, this most certainly means that this
        // project was freshly created in which case there simply are no tasks

        let error = null;
        let task = (project.tasks || []).find(t => t.name === taskName);
        if (!task) {
            const { data, error: err } = await this.getTaskOfProject({ 
                        projectId: project.id,
                        taskName: encodeURIComponent(taskName) 
                    });

            task = data && data.length > 0 ? data[0] : null;
            error = err;
        }
    
        if (!task && this.createObjects) {
            const { data, error: err, status } = await this.createTask(project.id, taskName);
            task = data;
            if (status === 201) {
                // created: true 
            }
            if (err) {
                if (err.status === 403) {
                    // onlyAdminsCanCreateProjects = true;
                }
                error = err; 
            }
        }
        return { task, error };
    }

    static async getTaskOfProject({projectId, taskName}) {
        const endPoint = `${this.apiEndpoint}/v1/workspaces/${this.workspaceId}/projects/${projectId}/tasks?name=${taskName}&strict-name-search=true`;
        return await this.apiCall(endPoint)
    }

    static async createTask(projectId, taskName) {
        const endPoint = `${this.urlProjects}/${projectId}/tasks/`;
        const body = {
            name: taskName,
            projectId
        }
        return await this.apiCall(endPoint, 'POST', body);
    }

}