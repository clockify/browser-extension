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
    aBrowser.storage.sync.get(['token', 'activeWorkspaceId'], function (result) {
        let token = result.token;
        let activeWorkspaceId = result.activeWorkspaceId;

        this.endInProgress(new Date())
            .then(response => response)
            .then(data => {
                if(data.status === 400) {
                    alert("You already have entry in progress which can't be saved without project/task/description or tags. Please edit your time entry.")
                } else {
                    startTimer(info && info.selectionText ? info.selectionText : "");
                }
            })
            .catch(() => {
                aBrowser.browserAction.setIcon({
                    path: iconPathEnded
                });
            })
    });
}

function endInProgress(end) {
    const token = localStorage.getItem('token');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');

    const endInProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/endStarted`;

    const endRequest = new Request(endInProgressUrl, {
        method: 'PUT',
        headers: new Headers({
            'X-Auth-Token': token,
            'Content-Type': 'application/json',
        }),
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
    let timeEntryUrl =
        `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/`;

    let timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Auth-Token': token
        }),
        body: JSON.stringify({
            start: new Date(),
            description: description,
            billable: false,
            projectId: options && options.projectId ? options.projectId : null,
            tagIds: options && options.tagIds ? options.tagIds : [],
            taskId: options && options.taskId ? options.taskId : null
        })
    });

    fetch(timeEntryRequest)
        .then(response => response.json())
        .then(data => {
            if(!data.message) {
                window.inProgress = true;
                aBrowser.browserAction.setIcon({
                    path: iconPathStarted
                });
            }

        })
        .catch(error => {
        })
}

function getEntryInProgress() {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');

    let inProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/inProgress`;
    let timeEntryInProgressRequest = new Request(inProgressUrl, {
        method: 'GET',
        headers: new Headers({
            'X-Auth-Token': token
        })
    });

    return fetch(timeEntryInProgressRequest);
}

function deleteEntry(entryId) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');

    const deleteUrl =
        `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/${entryId}`;

    let deleteEntryRequest = new Request(deleteUrl, {
        method: 'DELETE',
        headers: new Headers({
            'X-Auth-Token': token
        })
    });

    fetch(deleteEntryRequest).then(() => {});

}

function startTimerOnStartingBrowser() {
    const userId = localStorage.getItem('userId');
    const autoStartForCurrentUserEnabled = localStorage.getItem('permanent_autoStartOnBrowserStart') ?
        JSON.parse(localStorage.getItem('permanent_autoStartOnBrowserStart'))
            .filter(autoStart => autoStart.userId === userId && autoStart.enabled).length > 0 : false;

    if (autoStartForCurrentUserEnabled) {
        this.startTimer('');
    }
}

function endInProgressOnClosingBrowser() {
    const userId = localStorage.getItem('userId');
    const autoStopForCurrentUserEnabled = localStorage.getItem('permanent_autoStopOnBrowserClose') ?
        JSON.parse(localStorage.getItem('permanent_autoStopOnBrowserClose'))
            .filter(autoStop => autoStop.userId === userId && autoStop.enabled).length > 0 : false;

    if (autoStopForCurrentUserEnabled) {
        this.getEntryInProgress().then(response => response.json()).then(data => {
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

function saveEntryOfflineAndStopItByDeletingIt(data, end) {
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

    this.deleteEntry(data.id);
}