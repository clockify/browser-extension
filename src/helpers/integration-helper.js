import {TokenService} from "../services/token-service";
import * as React from 'react';
import {ProjectHelper} from "./project-helper";
import {TagService} from "../services/tag-service";
import {LocalStorageService} from "../services/localStorage-service";
import {HttpHeadersHelper} from "./http-headers-helper";

const localStorageService = new LocalStorageService();
const tokenService = new TokenService();
const projectHelpers = new ProjectHelper();
const tagService = new TagService();
const httpHeadersHelper = new HttpHeadersHelper();

export function getEntryInProgress() {
    const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
    const baseUrl = localStorageService.get('baseUrl');
    const inProgressUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/inProgress`;

    return tokenService.getToken().then(token => {
        if (token) {
            return createInProgressUrlAndFetch(inProgressUrl, token);
        } else {
            tokenService.logout();
            return new Promise((resolve, reject) => {
                reject();
            });
        }
    });
}

export function stopInProgress() {
    const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
    const baseUrl = localStorageService.get('baseUrl');
    let endInProgressUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/endStarted`;

    return tokenService.getToken().then(token => {
        if (token) {
            return createStopInProgressUrlAndFetch(endInProgressUrl, token);
        } else {
            tokenService.logout();
            return new Promise((resolve, reject) => {
                reject();
            });
        }
    });
}

export function startTimer(timeEntryOptions) {
    const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
    const baseUrl = localStorageService.get('baseUrl');
    let timeEntryUrl =
        `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/`;

    return tokenService.getToken().then(token => {
        if (token) {
            return startTimeEntryRequestAndFetch(timeEntryUrl, token, timeEntryOptions);
        } else {
            tokenService.logout();
            return new Promise((resolve, reject) => {
                reject();
            });
        }
    });
}

function createInProgressUrlAndFetch (inProgressUrl, token) {
    const headers =  new Headers(httpHeadersHelper.createHttpHeaders(token));
    let timeEntryInProgressRequest = new Request(inProgressUrl, {
        method: 'GET',
        headers: headers
    });
    return fetch(timeEntryInProgressRequest)
        .then(response => response.json())
        .catch(() => {
            return {};
        });
}

function createStopInProgressUrlAndFetch (endInProgressUrl, token) {
    const headers =  new Headers(httpHeadersHelper.createHttpHeaders(token));
    let endRequest = new Request(endInProgressUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
            end: new Date()
        })
    });

    return fetch(endRequest)
        .then(response => response);
}

async function createTask(token, projectId, taskName) {
    const headers =  new Headers(httpHeadersHelper.createHttpHeaders(token));

    const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
    const baseUrl = localStorageService.get('baseUrl');
    let url = `${baseUrl}/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks/`;

    const req = new Request(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            name: taskName,
            projectId: projectId
        })
    });

    return fetch(req)
        .then(response => {
            if (response.status === 201) {
                return response.json();
            } else {
                // task creation failed
                return null;
            }
        });
}

async function getOrCreateTask(token, project, taskName) {
    // try to find the appropriate task for this
    // if project.tasks is not present, this most certainly means that this
    // project was freshly created in which case there simply are no tasks
    const task = (project.tasks || []).find(t => t.name === taskName);

    if (task) {
        return task;
    } else if (JSON.parse(localStorageService.get('createObjects', false))) {
        return await createTask(token, project.id, taskName);
    }
}

async function getOrCreateTags(tagNames) {
    const existingTagsResponse = await tagService.getAllTagsWithFilter(1, 100);

    if (existingTagsResponse.status !== 200) {
        return [];
    }
    
    const existingTags = existingTagsResponse.data;
    const tags = [];

    for (const n of tagNames) {
        const t = existingTags.find(e => e.name === n);
        if (t) {
            tags.push(t);
        } else if (JSON.parse(localStorageService.get('createObjects', false))) {
            try {
                const r = await tagService.createTag({ name: n });
                if (r.status === 201) {
                    tags.push(r.data);
                }
            }
            catch (e) {
                // request failed, probably because of wrong permissions; we just ignore this tag
                console.error(e);
            }
        }
    }

    return tags;
}

async function startTimeEntryRequestAndFetch (timeEntryUrl, token, options) {
    const headers =  new Headers(httpHeadersHelper.createHttpHeaders(token));
    const project = await projectHelpers.getProjectForButton(options.projectName);

    let task = null;
    if (project && options.taskName) {
        task = await getOrCreateTask(token, project, options.taskName);
    }

    let tags = [];
    if (options.tagNames) {
        tags = await getOrCreateTags(options.tagNames);
    }

    let billable = options.billable;
    if (billable === undefined || billable === null) {
        billable = project ? project.billable : false;
    }

    const timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            start: options.start || new Date(),
            end: options.end, // can be undefined
            description: options.description,
            billable: billable,
            projectId: project ? project.id : null,
            tagIds: tags.map(e => e.id),
            taskId: task ? task.id : null
        })
    });

    return fetch(timeEntryRequest)
        .then(response =>  {
            return response.json().then(json => {
                return { status: response.status, data: json };
            });
        });
}

export async function getDefaultProjectBackground() {
    return await projectHelpers.getProjectForButton('');
}