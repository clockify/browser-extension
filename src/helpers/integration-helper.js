import {TokenService} from "../services/token-service";
import * as React from 'react';
import {ProjectHelper} from "./project-helper";
import {LocalStorageService} from "../services/localStorage-service";
import {HttpHeadersHelper} from "./http-headers-helper";

const localStorageService = new LocalStorageService();
const tokenService = new TokenService();
const projectHelpers = new ProjectHelper();
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

async function startTimeEntryRequestAndFetch (timeEntryUrl, token, description, projectName) {
    const headers =  new Headers(httpHeadersHelper.createHttpHeaders(token));
    const project = await projectHelpers.getProjectForButton(projectName);
    const timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: headers,
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