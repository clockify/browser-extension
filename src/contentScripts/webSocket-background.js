const webSocketEventsEnums = {
    'TIME_ENTRY_STARTED': 'TIME_ENTRY_STARTED',
    'TIME_ENTRY_STOPPED': 'TIME_ENTRY_STOPPED',
    'TIME_ENTRY_DELETED': 'TIME_ENTRY_DELETED',
    'TIME_ENTRY_UPDATED': 'TIME_ENTRY_UPDATED',
    'TIME_ENTRY_CREATED': 'TIME_ENTRY_CREATED',
    'NEW_NOTIFICATIONS': 'NEW_NOTIFICATIONS',
    'TIME_TRACKING_SETTINGS_UPDATED': 'TIME_TRACKING_SETTINGS_UPDATED',
    'WORKSPACE_SETTINGS_UPDATED': 'WORKSPACE_SETTINGS_UPDATED',
    'CHANGED_ADMIN_PERMISSION': 'CHANGED_ADMIN_PERMISSION'
};
Object.freeze(webSocketEventsEnums);

document.isFirstTimeSettingTimeEntry = true;
let onErrorReconnectTimeout;
let onCloseReconnectTimeout;

function connectWebSocket() {
    if (JSON.parse(localStorage.getItem('selfhosted_selfHosted'))) {
        return;
    }

    const webSocketClientId = localStorage.getItem('webSocketClientId');
    const userEmail = localStorage.getItem('userEmail');
    const webSocketEndpoint = localStorage.getItem("webSocketEndpoint");

    if (!webSocketClientId || !userEmail || !webSocketEndpoint) {
        return;
    }

    const connectionId = `/${localStorage.getItem('webSocketClientId')}/` +
        `${localStorage.getItem('userEmail')}/` +
        `${Math.random().toString(36).substring(2, 10)}`;

    document.connection = new WebSocket(
        `${localStorage.getItem("webSocketEndpoint")}${connectionId}`
    );

    document.connection.onopen = (event) => {
        if (event.type === 'open') {
            this.getToken().then(token => {
                if (!!token) {
                    this.authenticate(token);
                }
            });
        }
    };

    document.connection.onclose = (event) => {
        if (onErrorReconnectTimeout) {
            clearTimeout(onErrorReconnectTimeout);
        }

        if (event.code === 4000) {
            return;
        }

        onCloseReconnectTimeout =
            setTimeout(() => this.connectWebSocket(document.token), getReconnectTimeout());
    };


    document.connection.onmessage = (message) => {
        this.messageHandler(message);
    };

    document.connection.onerror = (error) => {
        if (onCloseReconnectTimeout) {
            clearTimeout(onCloseReconnectTimeout);
        }
        onErrorReconnectTimeout =
            setTimeout(() => this.connectWebSocket(document.token), getReconnectTimeout());
    }
}

function disconnectWebSocket() {
    if (document.connection) {
        document.connection.close(4000, 'Closing connection permanent');
        document.connection = null;
    }
}

function messageHandler(event) {
    switch (event.data) {
        case webSocketEventsEnums.TIME_ENTRY_STARTED:
            this.getEntryInProgress().then(response => response.json()).then(data => {
                this.entryInProgressChangedEventHandler(data);
                document.timeEntry = data;
                aBrowser.browserAction.setIcon({
                    path: iconPathStarted
                });
            }).catch();
            this.sendWebSocketEventToExtension(event.data);
            this.addIdleListenerIfIdleIsEnabled();
            this.removeReminderTimer();
            break;
        case webSocketEventsEnums.TIME_ENTRY_CREATED:
            this.sendWebSocketEventToExtension(event.data);
            break;
        case webSocketEventsEnums.TIME_ENTRY_STOPPED:
            this.entryInProgressChangedEventHandler(null);
            document.timeEntry = null;
            aBrowser.browserAction.setIcon({
                path: iconPathEnded
            });
            this.sendWebSocketEventToExtension(event.data);
            this.removeIdleListenerIfIdleIsEnabled();
            this.addReminderTimer();
            break;
        case webSocketEventsEnums.TIME_ENTRY_UPDATED:
            this.getEntryInProgress().then(response => response.json()).then(data => {
                this.entryInProgressChangedEventHandler(data);
                document.timeEntry = data;
            });
            this.sendWebSocketEventToExtension(event.data);
            break;
        case webSocketEventsEnums.TIME_ENTRY_DELETED:
             this.getEntryInProgress().then(response => response.json()).then(data => {
                 this.entryInProgressChangedEventHandler(data);
                 document.timeEntry = data;
                 aBrowser.browserAction.setIcon({
                     path: iconPathStarted
                 });
             }).catch(() => {
                 this.entryInProgressChangedEventHandler(null);
                 document.timeEntry = null;
                 aBrowser.browserAction.setIcon({
                     path: iconPathEnded
                 });
                 this.removeIdleListenerIfIdleIsEnabled();
                 this.addReminderTimer();
             });
            this.sendWebSocketEventToExtension(event.data);
             break;
        case webSocketEventsEnums.WORKSPACE_SETTINGS_UPDATED:
            this.sendWebSocketEventToExtension(event.data);
            break;
        case webSocketEventsEnums.CHANGED_ADMIN_PERMISSION:
            this.sendWebSocketEventToExtension(event.data);
            break;
    }
};

function sendWebSocketEventToExtension(event) {
    aBrowser.runtime.sendMessage({eventName: event});
}

function authenticate(token) {
    if (!document.connection || !token) return;

    document.connection.send(token);
}

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.eventName) {
        case "webSocketConnect":
            if (!document.connection) {
                this.connectWebSocket();
            }
            break;
        case "webSocketDisconnect":
            if (document.connection) {
                this.disconnectWebSocket();
            }
            break;
        case "getEntryInProgress":
            if (
                (!document.timeEntry || document.timeEntry === undefined) &&
                    document.isFirstTimeSettingTimeEntry
            ) {
                document.isFirstTimeSettingTimeEntry = false;
                this.getEntryInProgress().then(response => response.json()).then(data => {
                    document.timeEntry = data;
                    aBrowser.browserAction.setIcon({
                        path: iconPathStarted
                    });
                }).catch(() => {
                    document.timeEntry = null;
                    aBrowser.browserAction.setIcon({
                        path: iconPathEnded
                    });
                });
            }
            sendResponse(document.timeEntry);
            break;
    }
});

function entryInProgressChangedEventHandler(data) {
    aBrowser.storage.sync.set({
        timeEntryInProgress: data
    });
}

function getReconnectTimeout() {
    const min = 5 * 1000;
    const max = 15 * 1000;

    return Math.floor(Math.random() * (max - min + 1)) + min;
};

