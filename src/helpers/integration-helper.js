import {TokenService} from "../services/token-service";
import * as React from 'react';
import {ProjectHelper} from "./project-helper";
import {LocalStorageService} from "../services/localStorage-service";


const localStorageService = new LocalStorageService();
const tokenService = new TokenService();
const projectHelpers = new ProjectHelper();

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

export function startTimer(description, projectName) {
    const activeWorkspaceId = localStorageService.get('activeWorkspaceId');
    const baseUrl = localStorageService.get('baseUrl');
    let timeEntryUrl =
        `${baseUrl}/workspaces/${activeWorkspaceId}/timeEntries/`;

    return tokenService.getToken().then(token => {
        if (token) {
            return startTimeEntryRequestAndFetch(timeEntryUrl, token, description, projectName);
        } else {
            tokenService.logout();
            return new Promise((resolve, reject) => {
                reject();
            });
        }
    });
}

function createInProgressUrlAndFetch (inProgressUrl, token) {
    let timeEntryInProgressRequest = new Request(inProgressUrl, {
        method: 'GET',
        headers: new Headers({
            'X-Auth-Token': token
        })
    });
    return fetch(timeEntryInProgressRequest)
        .then(response => response.json())
        .catch(() => {
            return {};
        });
}

function createStopInProgressUrlAndFetch (endInProgressUrl, token) {
    let endRequest = new Request(endInProgressUrl, {
        method: 'PUT',
        headers: new Headers({
            'X-Auth-Token': token,
            'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
            end: new Date()
        })
    });

    return fetch(endRequest)
        .then(response => response);
}

async function startTimeEntryRequestAndFetch (timeEntryUrl, token, description, projectName) {
    const project = await projectHelpers.getProjectForButton(projectName);

    const timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Auth-Token': token
        }),
        body: JSON.stringify({
            start: new Date(),
            description: description,
            billable: project ? project.billable : false,
            projectId: project ? project.id : null,
            tagIds: [],
            taskId: null
        })
    });
        return fetch(timeEntryRequest)
            .then(response => response.json());
}

export async function getDefaultProjectBackground() {
    return await projectHelpers.getProjectForButton('');
}