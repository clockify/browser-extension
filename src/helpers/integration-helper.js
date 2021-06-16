import {TokenService} from "../services/token-service";
import * as React from 'react';
import {ProjectHelper} from "./project-helper";
import {TagService} from "../services/tag-service";
import {LocalStorageService} from "../services/localStorage-service";
import {HttpHeadersHelper} from "./http-headers-helper";

const localStorageService = new LocalStorageService();
const tokenService = new TokenService();
const projectHelper = new ProjectHelper();
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
    let timeEntryUrl = `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/`;

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
    let task = (project.tasks || []).find(t => t.name === taskName);
    if (!task) {
        task = await projectHelper.getTaskOfProject({ 
                    projectId: project.id,
                    taskName: encodeURIComponent(taskName) 
                })
                .then(response => {
                    return response.data.taskList.length > 0 ? response.data.taskList[0] : null;
                })
                .catch(() => {
                    return null;
                });
    }

    if (task) {
        return task;
    } 
    else if (JSON.parse(localStorageService.get('createObjects', false))) {
        return await createTask(token, project.id, taskName);
    }
}

async function getOrCreateTags(tagNames) {
    const pageSize = 50;
    let allTags = [];
    for (var page=1; page < 20; page++) {
        const response = await tagService.getAllTagsWithFilter(page, pageSize);
        if (response.status !== 200) {
            break; //return [];
        }
        const pageTags = response.data;
        allTags = allTags.concat(pageTags);
        if (pageTags.length < pageSize)
            break;
    }

    
    const tags = [];

    for (const n of tagNames) {
        const t = allTags.find(e => e.name.toUpperCase() === n.toUpperCase());
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
    const headers = new Headers(httpHeadersHelper.createHttpHeaders(token));
    let {
        projectDB, taskDB, msg,
        found, created, onlyAdminsCanCreateProjects, takenFromDefaultProjectTask
    } = await projectHelper.getProjectForButton(options.projectName);

    let message = msg ? msg : ''; 
    if (onlyAdminsCanCreateProjects) {
        message += "Only Admins can create projects.";
    }

    let task = null;
    if (takenFromDefaultProjectTask) {
        task = taskDB;
    }
    else {
        const str = localStorageService.get('workspaceSettings');
        const workspaceSettings = str ? JSON.parse(str) : {};
        const { forceTasks } = workspaceSettings;
        if (projectDB) {
            if (found || created) {
                if (options.taskName) {
                    const taskName = options.taskName.trim().replace(/\s+/g, ' '); // /\s\s+/g
                    task = await getOrCreateTask(token, projectDB, taskName);
                }
            }
            if (forceTasks && !task) {
                const { projectDB: p, taskDB: t } = await projectHelper.checkDefaultProjectTask(forceTasks);
                projectDB = p;
                task = t;
            }
        }  
    }


    let tags = [];
    if (options.tagNames) {
        tags = await getOrCreateTags(options.tagNames);
    }

    let billable = options.billable;
    if (billable === undefined || billable === null) {
        billable = projectDB ? projectDB.billable : false;
    }

    const timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            start: options.start || new Date(),
            end: options.end, // can be undefined
            description: options.description,
            billable,
            projectId: projectDB ? projectDB.id : null,
            taskId: task ? task.id : null,
            tagIds: tags.map(e => e.id)
        })
    });

    return fetch(timeEntryRequest)
        .then(response =>  {
            return response.json().then(json => {
                if (!!message)
                    json = Object.assign(json, {message})
                return { 
                    status: response.status,
                    data: (task ? Object.assign(json, { task: task }) : json)
                };
            });
        });
}

export async function getProjects(options) {
    return await projectHelper.getProjects(options);
}

export async function getProjectTasks(options) {
    return await projectHelper.getProjectTasks(options);
}

export async function getProjectsByIdsForIntegration(options) {
    return await projectHelper.getProjectsByIdsForIntegration(options);
}

export async function getProjectTaskFromDB() {
    const str = localStorageService.get('workspaceSettings');
    const workspaceSettings = str ? JSON.parse(str) : {};
    const { forceTasks } = workspaceSettings;
    const { storage, defaultProject } = DefaultProject.getStorage();
    return await defaultProject.getProjectTaskFromDB(forceTasks);
}


export async function getTags({ filter, page, pageSize}) {
    return await tagService.getAllTagsWithFilter(page, pageSize, filter)
        .then(response => {
            let data = response.data;
            return Promise.resolve({
                status: 201,
                data
            })                    
        })
        .catch(() => {
        });
}

