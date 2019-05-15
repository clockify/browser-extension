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
                startTimer(activeWorkspaceId, token, info ? info.selectionText : "");
            })
    });
}

function endInProgressAndStartNew(info) {
    aBrowser.storage.sync.get(['token', 'activeWorkspaceId'], function (result) {
        let token = result.token;
        let activeWorkspaceId = result.activeWorkspaceId;
        const apiEndpoint = localStorage.getItem('permanent_baseUrl');
        let endInProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/endStarted`;
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

        fetch(endRequest)
            .then(response => response)
            .then(data => {
                if(data.status === 400) {
                    alert("You already have entry in progress which can't be saved without project/task/description or tags. Please edit your time entry.")
                } else {
                    startTimer(activeWorkspaceId, token, info && info.selectionText ? info.selectionText : "");
                }
            })
            .catch(() => {
                aBrowser.browserAction.setIcon({
                    path: iconPathEnded
                });
            })
    });
}

function startTimer(activeWorkspaceId, token, description) {
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
            projectId: null,
            tagIds: [],
            taskId: null
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

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'getEntryInProgress') {
        sendResponse(document.timeEntry);
    }
});