function startTimerWithDescription(info) {
    let token;
    let activeWorkspaceId;
    aBrowser.storage.sync.get(['token', 'activeWorkspaceId'], function (result) {
        token = result.token;
        activeWorkspaceId = result.activeWorkspaceId;

        this.getEntryInProgress()
            .then(response => response.json())
            .then(data => {
                endInProgressAndStartNew(info);
            })
            .catch(error => {
                startTimer(info ? info.selectionText : "");
            })
    });
}

function endInProgressAndStartNew(info) {
    this.endInProgress(new Date())
        .then(response => response)
        .then(data => {
            if(data.status === 400) {
                alert("You already have entry in progress which can't be saved without project/task/description or tags. Please edit your time entry.")
            } else {
                this.entryInProgressChangedEventHandler(null);
                startTimer(info && info.selectionText ? info.selectionText : "");
            }
        })
        .catch(() => {
            aBrowser.browserAction.setIcon({
                path: iconPathEnded
            });
        })
}

function endInProgress(end, isWebSocketHeader) {
    const token = localStorage.getItem('token');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const headers = new Headers(this.createHttpHeaders(token));

    const endInProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/endStarted`;

    const endRequest = new Request(endInProgressUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({
            end: end
        })
    });

    return fetch(endRequest);
}

function startTimer(description, options) {
    const token = localStorage.getItem('token');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const headers = new Headers(this.createHttpHeaders(token));

    let timeEntryUrl =
        `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/`;

    let timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            start: new Date(),
            description: description,
            billable: false,
            projectId: options && options.projectId ? options.projectId : null,
            tagIds: options && options.tagIds ? options.tagIds : [],
            taskId: options && options.taskId ? options.taskId : null
        })
    });

    return fetch(timeEntryRequest)
        .then(response => response.json())
        .then(data => {
            if(!data.message) {
                window.inProgress = true;
                aBrowser.browserAction.setIcon({
                    path: iconPathStarted
                });

                if (options.isWebSocketHeader) {
                    document.timeEntry = data;
                }
                this.entryInProgressChangedEventHandler(data);
            }
            return data;
        })
        .catch(error => {
            return error;
        });
}

function getEntryInProgress() {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');
    const headers = new Headers(this.createHttpHeaders(token));

    let inProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/inProgress`;
    let timeEntryInProgressRequest = new Request(inProgressUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(timeEntryInProgressRequest);
}

function deleteEntry(entryId, isWebSocketHeader) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');

    const deleteUrl =
        `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/${entryId}`;

    const headers = new Headers(this.createHttpHeaders(token));

    let deleteEntryRequest = new Request(deleteUrl, {
        method: 'DELETE',
        headers: headers
    });

    return fetch(deleteEntryRequest).then(() => {
        if (isWebSocketHeader) {
            document.timeEntry = null;
        }
        this.entryInProgressChangedEventHandler(null);
    });

}

function startTimerOnStartingBrowser() {
    const userId = localStorage.getItem('userId');
    const autoStartForCurrentUserEnabled = localStorage.getItem('permanent_autoStartOnBrowserStart') ?
        JSON.parse(localStorage.getItem('permanent_autoStartOnBrowserStart'))
            .filter(autoStart => autoStart.userId === userId && autoStart.enabled).length > 0 : false;

    if (autoStartForCurrentUserEnabled) {
        this.getDefaultProject().then(defaultProject => {
            this.startTimer('', defaultProject ? {projectId: defaultProject.id} : {});
        });
    }
}

function endInProgressOnClosingBrowser() {
    const userId = localStorage.getItem('userId');
    const autoStopForCurrentUserEnabled = localStorage.getItem('permanent_autoStopOnBrowserClose') ?
        JSON.parse(localStorage.getItem('permanent_autoStopOnBrowserClose'))
            .filter(autoStop => autoStop.userId === userId && autoStop.enabled).length > 0 : false;

    if (autoStopForCurrentUserEnabled) {
        this.getEntryInProgress().then(response => response.json()).then(data => {
            if (!data.projectId) {
                this.getDefaultProject().then(defaultProject => {
                    if (defaultProject) {
                        this.updateProject(defaultProject.id, data.id)
                            .then(response => response.json())
                            .then(data => {
                                this.endInProgress(new Date()).then((response) => {
                                    if (response.status === 400) {
                                        const endTime = new Date();
                                        this.saveEntryOfflineAndStopItByDeletingIt(data, endTime);
                                    }
                                });
                            }
                        );
                    }
                });
            }
            this.endInProgress(new Date()).then((response) => {
                if (response.status === 400) {
                    const endTime = new Date();
                    this.saveEntryOfflineAndStopItByDeletingIt(data, endTime);
                }
            });
        }).catch(() => {});
    }
}

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'getEntryInProgress') {
        sendResponse(document.timeEntry);
    }
});

function saveEntryOfflineAndStopItByDeletingIt(data, end, isWebSocketHeader) {
    const timeEntry = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        description: data.description,
        projectId: data.projectId,
        taskId: data.taskId,
        billabe: data.billable,
        timeInterval: {
            start: data.timeInterval.start,
            end: new Date(end)
        }
    };
    const timeEntriesOffline = localStorage.getItem('timeEntriesOffline') ?
        JSON.parse(localStorage.getItem('timeEntriesOffline')) : [];

    timeEntriesOffline.push(timeEntry);
    localStorage.setItem('timeEntriesOffline', JSON.stringify(timeEntriesOffline));

    return this.deleteEntry(data.id, isWebSocketHeader);
}

function getLastEntry() {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    const getLastEntryUrl = `${apiEndpoint}/v1/workspaces/${activeWorkspaceId}/user/${userId}/time-entries?page-size=2`;

    const headers = new Headers(this.createHttpHeaders(token));


    let lastEntryRequest = new Request(getLastEntryUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(lastEntryRequest).then(response => response.json()).then(timeEntries => {
        if (timeEntries && timeEntries.length > 0) {
            return timeEntries.filter(entry => !!entry.timeInterval.end)[0];
        } else {
            return new Promise((resolve, reject) => reject());
        }
    });
}

function updateProject(projectId, timeEntryId) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');
    const updateProjectUrl =
        `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/${timeEntryId}/project`;
    const headers = new Headers(this.createHttpHeaders(token));
    const body = {
        projectId: projectId
    };

    let updateProjectRequest = new Request(updateProjectUrl, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(body)
    });

    return fetch(updateProjectRequest);
}