let aBrowser = this.isChrome() ? chrome : browser;

const iconPathEnded = '../assets/images/logo-16-gray.png';
const iconPathStarted = '../assets/images/logo-16.png';
const clockifyProd = 'https://clockify.me/tracker';
let windowIds = [];

const tabStatus = {
    COMPLETE: 'complete',
    LOADING: 'loading'
};
Object.freeze(tabStatus);

const commands = {
    startStop: 'quick-start-stop-entry'
};
Object.freeze(commands);

function setTimeEntryInProgress(entry) {
    aBrowser.storage.local.set({
        timeEntryInProgress: entry
    });
}

aBrowser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        aBrowser.tabs.create({'url': clockifyProd});
        aBrowser.browserAction.setIcon({
            path: iconPathEnded
        });
    }


});

/* 
    Clockify Time Tracker / Cross-extension messaging.
    Exposing a public API that other extensions can take advantage of.

    External Extensions use Authentication and Settings of Clockify Time Tracker Extension.

    Example:

    const aBrowser = (isChrome || isEdge) ? chrome : browser;
    // Clockify Time Tracker Extension ID
    const extensionID = (isChrome || isEdge) 
            ? 'pmjeegjhjdlccodhacdgbgfagbpmccpe'
            : '{1262fc44-5ec9-4088-a7a7-4cd42f3f548d}';

    // start new Time Entry
    aBrowser.runtime.sendMessage(
        extensionID, 
        {
            eventName: 'startNewEntry',
            data: {
                description: 'studying',
                project: { name: '' || 'abc' || null },
                task: { name: '' || 'ttt' || null },
                billable: false || true || null,
                tags: ['media', 'social']
            }
        },
        (response) => {
            if (response) {
                const { entry, message } = response;
                console.log(entry, message);
            }
        }
    );

    // stop Entry in progress
    aBrowser.runtime.sendMessage(
        extensionID, 
        {
            eventName: 'endInProgress'
        },
        (response) => {
            if (response) {
                const { entry, message } = response;
                console.log(entry, message);
            }
        }
    );
*/

_messageExternal_busy = false;
aBrowser.runtime.onMessageExternal.addListener(async (request, sender, sendResponse) => {
    if (_messageExternal_busy) {
        sendResponse({entry: null, message: 'Request denied. Previous is being executed!'});
        return;
    }
    _messageExternal_busy = true;
    switch (request.eventName) {
        case 'startNewEntry': {
            TimeEntry.startNewEntryExternal(request.data)
                .then(res => {
                    sendResponse(res)
                })
        }
        break;

        case 'endInProgress': {
            TimeEntry.endInProgressExternal()
                .then(res => {
                    const { entry, error } = res;
                    sendResponse({entry, message: error ? error.message : 'Time entry stopped!'})
                })            
        }
        break;
        
        default:
            sendResponse({entry: null, message: 'Unknown: '+ request.eventName});
    }
    _messageExternal_busy = false;
    return true;
});


aBrowser.windows.getAll({ populate: true, windowTypes: ["normal"] },
    (windowInfoArray) => {
        for (windowInfo of windowInfoArray) {
            windowIds.push(windowInfo.id)
        }
    }
)


aBrowser.windows.onCreated.addListener(async (window) => {
    if (this.isLoggedIn() && windowIds.length === 0) {
        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (entry === null || error) {
            this.addReminderTimerOnStartingBrowser();
            TimeEntry.startTimerOnStartingBrowser();
            setTimeEntryInProgress(null);
            aBrowser.browserAction.setIcon({
                path: iconPathEnded
            });
        }
        else {
            setTimeEntryInProgress(entry);
            aBrowser.browserAction.setIcon({
                path: iconPathStarted
            });
        }
        this.connectWebSocket();
    }
    windowIds = [...windowIds, window.id];
});

aBrowser.windows.onRemoved.addListener((window) => {
    if (windowIds.includes(window)) {
        windowIds.splice(windowIds.indexOf(window), 1);
    }

    if (windowIds.length === 0) {
        this.removeReminderTimer();
        TimeEntry.endInProgressOnClosingBrowser();
        this.disconnectWebSocket();
        this.restartPomodoro();
    }
});

fetch("integrations/integrations.json")
    .then(response => response.json())
    .then(data => {
        window.ClockifyOrigins = data;
    });


// call it
UserWorkspaceStorage.getSetWorkspaceSettings();

aBrowser.commands.onCommand.addListener(async (command) => {
    const activeWorkspaceId = localStorage.getItem("activeWorkspaceId");
    const token = localStorage.getItem('token');
    const timerShortcut = localStorage.getItem('permanent_timerShortcut');
    const userId = localStorage.getItem('userId');
    const isTimerShortcutOn = timerShortcut && 
            JSON.parse(timerShortcut)
                .find(item => item.userId === userId && JSON.parse(item.enabled));

    if (!isTimerShortcutOn) 
        return
    if (command !== commands.startStop)
        return
    if (!isLoggedIn()) {
        alert('You must log in to use keyboard shortcut (backgorund)');
        return
    }

    const { entry, error } = await TimeEntry.getEntryInProgress();
    if (entry) {
        const { error: err } = await TimeEntry.endInProgress(entry);
        // if (!err) {
        //     TimeEntry.startTimer('');
        // }
    } 
    else {
        // if (error) ?
        TimeEntry.startTimer('');
    }
 
});


aBrowser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url.includes("clockify.me"))
        return;
    if (changeInfo.status === "complete") {
        aBrowser.storage.local.get('permissions', (result) => {
            let domain = extractDomain(tab.url, result.permissions);
            if (!tab.url.includes("chrome://") && isLoggedIn()) {
                if (!!domain.file) {
                    aBrowser.tabs.insertCSS(tabId, {file: "integrations/style.css"});
                    aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyDebounce.js"});

                    const wsSettings = localStorage.getItem("workspaceSettings");
                    if (wsSettings) {
                        const workspaceSettings = JSON.parse(wsSettings);
                        let showPostStartPopup = true;
                        aBrowser.storage.local.get('showPostStartPopup', (result) => {
                            if (typeof result.showPostStartPopup !== 'undefined') {
                                showPostStartPopup = result.showPostStartPopup;
                            }
                        });

                        if (showPostStartPopup) {
                            aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyTagItem.js"});
                            aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyTagList.js"});
                            aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyProjectTaskList.js"});
                            aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyProjectItem.js"});
                            aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyProjectList.js"}, (firstLoad) => {
                                aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyPopupDlg.js"}, (firstLoad) => {
                                    aBrowser.tabs.executeScript(
                                        tabId, { 
                                            code: `_clockifyShowPostStartPopup = ${showPostStartPopup}`
                                        }
                                    );   
                                    aBrowser.tabs.executeScript(
                                        tabId, { 
                                            code: `ClockifyEditForm.prototype.wsSettings = {
                                                forceDescription: ${workspaceSettings.forceDescription},
                                                forceProjects: ${workspaceSettings.forceProjects},
                                                forceTasks: ${workspaceSettings.forceTasks},
                                                forceTags: ${workspaceSettings.forceTags},
                                                projectPickerSpecialFilter: ${workspaceSettings.projectPickerSpecialFilter}
                                            }`
                                        });
                                });
                            });
                        }
                    }                    

                    aBrowser.tabs.executeScript(tabId, {file: "integrations/clockifyButton.js"}, (firstLoad) => {
                        loadScripts(tabId, domain.file);
                    });
                }
            } 
            else if (tab.url.includes(aBrowser.identity.getRedirectURL())) {
                this.extractAndSaveToken(tab.url);
                aBrowser.tabs.remove(tabId, () => {});
            }
        });
    }
});

function loadScripts(tabId, file) {
    try {
        aBrowser.tabs.executeScript(tabId, {file: "integrations/" + file});
    } catch (e) {
    }
}

function extractDomain(url, permissions) {
    let domain, file;
    if (url.includes("://")) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }

    domain = domain.split('/*')[0];
    domain = domain.split('/')[0];
    file = getOriginFileName(domain, permissions);

    return {
        domain: domain,
        file: file,
        origins: [
            "*://" + domain + "/*"
        ]
    };
}

function extractAndSaveToken(url) {
    const [token, refreshToken] = url.split("?")[1]
        .replace('accessToken=','')
        .replace('refreshToken=','')
        .split('&');
        aBrowser.storage.local.set({
            token: (token),
            refreshToken: (refreshToken)
        });
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        UserService.getAndStoreUser();
}


function checkState(state) {
    return !(
        state &&
        localStorage.getItem('selfhosted_oAuthState') &&
        localStorage.getItem('selfhosted_oAuthState') === atob(state)
    );
}


function getParamFromUrl(params, paramName) {
    let param = "";

    if (!!params) {
        param = params.split("&")
            .filter(param => param.includes(paramName))
            .map(code => code.split('=')[1])[0];
    }

    return param;
}

function getOriginFileName(domain, permissionsFromStorage) {
    const userId = localStorage.getItem('userId');

    if (!permissionsFromStorage) {
        return null;
    }

    const permissionsByUser =
        permissionsFromStorage.filter(permission => permission.userId === userId)[0];

    if (!permissionsByUser) {
        return null;
    }

    const enabledPermissions = permissionsByUser.permissions.filter(p => p.isEnabled);
    if (
        enabledPermissions
            .filter(enabledPermission => enabledPermission.domain === domain)
            .length === 0
    ) {
        domain = domain.split(".");

        while (
            domain.length > 0 && enabledPermissions
                        .filter(enabledPermission => enabledPermission.domain === domain.join("."))
                        .length === 0
            ) {
            domain.shift();
        }
        domain = domain.join(".");

        if (
            enabledPermissions
            .filter(enabledPermission => enabledPermission.domain === domain)
            .length === 0
        ) {
            return null
        }
    }

    return enabledPermissions
        .filter(enabledPermission => enabledPermission.domain === domain)[0].script;
}

function isLoggedIn() {
    return localStorage.getItem('token') !== null && localStorage.getItem('token') !== undefined;
}



window.addEventListener("online",  () => {
    aBrowser.runtime.sendMessage({eventName: 'STATUS_CHANGED_ONLINE'});
});

window.addEventListener("offline", () => {
    aBrowser.runtime.sendMessage({eventName: 'STATUS_CHANGED_OFFLINE'});
});


// setTimeout(async () => {
//     const { entry, error } = await TimeEntry.getEntryInProgress();
//     if (error) {
//         console.log('EntryInProgress error:', error)
//     }
//     else {
//         console.log('EntryInProgress:', entry)
//     }
// }, 1000)


//setTimeout(async () => {
    // const  { storage, defaultProject } = DefaultProject.getStorage();
    // console.log('storage', storage)
    // console.log('defaultProject', defaultProject)
//}, 1000)


function afterStartTimer() {
    addIdleListenerIfIdleIsEnabled();
    removeReminderTimer();
    addPomodoroTimer();
}

