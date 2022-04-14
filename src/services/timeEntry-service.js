import moment from "moment";
import {HttpWrapperService} from "./http-wrapper-service";
import {LocalStorageService} from "./localStorage-service";

const addToken = true;
const localStorageService = new LocalStorageService();

export class TimeEntryService extends HttpWrapperService {
    constructor(){
        super();
    }

    async getTimeEntries(page) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const userId = await localStorageService.get('userId');
        const baseUrl = await localStorageService.get('baseUrl');

        const allTimeEntriesEndpoint =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/user/${userId}/full?page=${page}&limit=50`;

        return super.get(allTimeEntriesEndpoint, addToken);
    }

    async changeStart(start, timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const changeStartUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/start`;

        const body = {
            start: start
        };

        return super.put(changeStartUrl, body, addToken);
    }

    async changeEnd(end, timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const changeEndUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/end`;

        const body = {
            end: end
        };

        return super.put(changeEndUrl, body, addToken);
    }

    async editTimeInterval(entryId, timeInterval) {
        if (!entryId) {
            return;
        }
        const baseUrl = await localStorageService.get('baseUrl');
        const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId');
        const editIntervalUrl = `${baseUrl}/workspaces/` +
                                    `${activeWorkspaceId}/timeEntries/${entryId}/timeInterval`;

        let { start, end } = timeInterval;
        if(moment(start).date() !== moment(end).date()){
            start = moment(start).add(1, 'day');
            end = moment(end).add(1, 'day');
        }

        const body = {
            start,
            end
        };

        return super.put(editIntervalUrl, body, addToken);
    }

    async getEntryInProgress() {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const userId = await localStorageService.get('userId');
        const baseUrl = await localStorageService.get('baseUrl');
        const entryInProgressUrl =
            `${baseUrl}/v1/workspaces/${activeWorkspaceId}/user/${userId}/time-entries?in-progress=true&hydrated=true`;

        return super.get(entryInProgressUrl, addToken);
    }

    async healthCheck() {
        const baseUrl = await localStorageService.get('baseUrl');
        const url = `${baseUrl}/health`;
        return super.get(url, addToken);
    }

    async startNewEntry(projectId, description, billable, start, end = null, taskId = null, tagIds, customFields) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const startEntryUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/full`;

        if(end){
            if(moment(start).date() !== moment(end).date()){
                start = moment(start).add(1, 'day');
                end = moment(end).add(1, 'day');
            }
        }
        
        const body = {
            projectId,
            taskId,
            tagIds,
            description,
            start,
            end,
            billable,
            customFields
        };

        return super.post(startEntryUrl, body, addToken);
    }

    async stopEntryInProgress(end) {
        const timeEntryInProgress = await localStorageService.get('timeEntryInProgress');
        if(!timeEntryInProgress){
            return;
        }
        const { id, projectId, billable, task, description, timeInterval, customFieldValues, tags } = timeEntryInProgress;
        let { start } = timeInterval;
        const taskId = task ? task.id : null;
        const tagIds = tags ? tags.map(tag => tag.id) : [];
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');

        if(moment(start).date() !== moment(end).date()){
            start = moment(start).add(1, 'day');
            end = moment(end).add(1, 'day');
        }

        const stopEntryUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${id}/full`;
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

        return super.put(stopEntryUrl, body, addToken);
    }

    async setDescription(timeEntryId, description) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const descriptionUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/description`;

        const body = {
            description: description
        };

        return super.put(descriptionUrl, body, addToken);
    }

    async removeProject(timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const removeProjectUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/project/remove`;

        return super.delete(removeProjectUrl, addToken);
    }

    async updateProject(projectId, timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const updateProjectUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/project`;

        const body = {
            projectId: projectId
        };

        return super.put(updateProjectUrl, body, addToken);
    }

    async updateTask(taskId, projectId, timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const updateTaskAndProjectUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/projectAndTask`;

        const body = {
            projectId: projectId,
            taskId: taskId
        };
        
        return super.put(updateTaskAndProjectUrl, body, addToken);
    }

    async removeTask(timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const removeTaskUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/task/remove`;

        return super.delete(removeTaskUrl, addToken);
    }

    async updateTags(tagList, timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const updateTagList =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/tags`;

        const body = {
            tagIds: tagList
        };

        return super.put(updateTagList, body, addToken);
    }

    async updateBillable(billable, timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const billableUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/billable`;
        const body = {
            billable: billable
        };

        return super.put(billableUrl, body, addToken);
    }

    async deleteTimeEntry(timeEntryId) {
        const activeWorkspaceId = await localStorageService.get('activeWorkspaceId');
        const baseUrl = await localStorageService.get('baseUrl');
        const deleteUrl =
            `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}`;

        return super.delete(deleteUrl, addToken);

    }

    // createEntry(
    //     workspaceId,
    //     description,
    //     start,
    //     end,
    //     projectId,
    //     taskId,
    //     tagIds,
    //     billable,
    //     customFields
    // ) {
    //     const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    //     const wsId = workspaceId ? workspaceId : activeWorkspaceId;

    //     let baseUrl = localStorageService.get('baseUrl');
        /*
        if (baseUrl.includes('.api.')) {
            // https://global.api.clockify.me
            // https://global.clockify.me/api
            baseUrl = baseUrl.replace('.api', '') + '/api';
        }
        */
    //     const timeEntryUrl = `${baseUrl}/workspaces/${wsId}/timeEntries/`;

    //     const body = {
    //         description,
    //         start,
    //         end,
    //         projectId,
    //         taskId,
    //         tagIds,
    //         billable,
    //     };

    //     if (customFields)
    //         body.customFields = customFields;

    //     return super.post(timeEntryUrl, body, addToken);
    // }
}