let aBrowser = this.isChrome() ? chrome : Object.assign(browser, {
    action: browser.browserAction, 
    scripting: {
        executeScript: ({target, files, func, args}, cb) => {
            if(func){
                //Possible implementation which needs improvements
                // const regex = /\(([^{]*)\{([\s\S]*)\}$/;
                // const strargs = func.toString().match(regex)[1].replace(')', '').trim().split(',');
                // let strfunc = func.toString().match(regex)[2].trim();
                // for (index in strargs) {
                //     strfunc = strfunc.replace(strargs[index], args[index]);
                // }
                // console.log(strfunc);
                // browser.tabs.executeScript(target.tabId, {code: strfunc}, cb);
            }else{
                browser.tabs.executeScript(target.tabId, {file: files[0]}, cb);
            }
        },
        insertCSS: ({target, files}) => {
            browser.tabs.insertCSS(target.tabId, {file: files[0]});
        }
    }
});

const iconPathEnded = '../assets/images/logo-16-gray.png';
const iconPathStarted = '../assets/images/logo-16.png';
const clockifyProd = 'https://app.clockify.me/tracker';
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

aBrowser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        aBrowser.tabs.create({'url': clockifyProd});
        aBrowser.action.setIcon({
            path: iconPathEnded
        });
    }
    const localMessages = await localStorage.getItem('locale_messages');
    if((!localMessages || Object.keys(localMessages).length)){
        clockifyLocales.onProfileLangChange(null);
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
    try {
        switch (request.eventName) {
            case 'startNewEntry': {
                TimeEntry.startNewEntryExternal(request.data)
                    .then(res => {
                        sendResponse(res)
                        _messageExternal_busy = false;
                    })
            }
            break;

            case 'endInProgress': {
                TimeEntry.endInProgressExternal()
                    .then(res => {
                        const { entry, error } = res;
                        sendResponse({entry, message: error ? error.message : 'Time entry stopped!'})
                        _messageExternal_busy = false;
                    })            
            }
            break;
            
            default:
                sendResponse({entry: null, message: 'Unknown: '+ request.eventName});
        }
    }
    finally {
        //_messageExternal_busy = false;
    }
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
    const isLoggedIn = await TokenService.isLoggedIn();
    if (isLoggedIn && windowIds.length === 0) {
        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (entry === null || error) {
            this.addReminderTimerOnStartingBrowser();
            TimeEntry.startTimerOnStartingBrowser();
            setTimeEntryInProgress(null);
            aBrowser.action.setIcon({
                path: iconPathEnded
            });
        }
        else {
            setTimeEntryInProgress(entry);
            aBrowser.action.setIcon({
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


function setClockifyOriginsToStorage() {
    fetch("integrations/integrations.json")
        .then(response => response.json())
        .then(async clockifyOrigins => {
            // window.ClockifyOrigins = clockifyOrigins;
            const userId = await localStorage.getItem('userId');
            if (userId) {
                aBrowser.storage.local.get('permissions', (result) => {
                    const permissionsForStorage = result.permissions ? result.permissions : [];
                    let arr = permissionsForStorage.filter(permission => permission.userId === userId);
                    let permissionForUser;
                    if (arr.length === 0) {
                        permissionForUser = {
                            userId,
                            permissions: []
                        }
                        permissionsForStorage.push(permissionForUser);
                        for (let key in clockifyOrigins) {
                            permissionForUser.permissions.push({
                                domain: key,
                                isEnabled: true,
                                script: clockifyOrigins[key].script,
                                name: clockifyOrigins[key].name,
                                isCustom: false
                            });
                        }   
                        aBrowser.storage.local.set({permissions: permissionsForStorage});
                    }
                })
            }
        });
}

// call it
setClockifyOriginsToStorage();

UserWorkspaceStorage.getSetWorkspaceSettings();

UserService.getSetUserRoles();

setTimeout(() => {
    backgroundWebSocketConnect();
}, 1000);


// aBrowser.contextMenus.removeAll();
// aBrowser.contextMenus.create({
//     "title": "Start timer with description '%s'",
//     "contexts": ["selection"],
//     "onclick": (info) => TimeEntry.startTimerWithDescription(info)
// });
// aBrowser.contextMenus.create({
//     "title": "Start timer",
//     "contexts": ["page"],
//     "onclick": (info) => TimeEntry.startTimerWithDescription(info)
// });



aBrowser.commands.onCommand.addListener(async (command) => {
    const timerShortcut = await localStorage.getItem('permanent_timerShortcut');
    const userId = await localStorage.getItem('userId');
    const isTimerShortcutOn = timerShortcut && 
            JSON.parse(timerShortcut)
                .find(item => item.userId === userId && JSON.parse(item.enabled));
    const isLoggedIn = await TokenService.isLoggedIn();
    if (!isTimerShortcutOn) 
        return
    if (command !== commands.startStop)
        return
    if (!isLoggedIn) {
        // alert('You must log in to use keyboard shortcut (backgorund)');
        localStorage.setItem('integrationAlert', 'You must log in to use keyboard shortcut (backgorund)');
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

const chromeExtensionID = 'pmjeegjhjdlccodhacdgbgfagbpmccpe';
const firefoxExtensionID = '{1262fc44-5ec9-4088-a7a7-4cd42f3f548d}';

aBrowser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {

    const isIdentityRedirectUrl = tab.url.includes(aBrowser.identity.getRedirectURL())
    if (!isIdentityRedirectUrl && tab.url.includes("clockify.me")) {
        return;
    }
   
    if (changeInfo.status === "complete") {
        aBrowser.storage.local.get('permissions', async (result) => {
            let domain = await extractDomain(tab.url, result.permissions);
            const isLoggedIn = await TokenService.isLoggedIn();
            if (!tab.url.includes("chrome://") && isLoggedIn) {
                if (!!domain.file) {
                    aBrowser.scripting.insertCSS({target: {tabId}, files: ["integrations/style.css"]});
                    const userId = await localStorage.getItem('userId');
                    const darkMode = await localStorage.getItem("permanent_darkMode");
                    const isDarkMode = darkMode
                        ? JSON.parse(await localStorage.getItem("permanent_darkMode")).find(item => item.userId === userId && item.enabled)
                        : false;
                    if (isDarkMode){
                        aBrowser.scripting.insertCSS({target: {tabId}, files: ["integrations/dark-style.css"]});
                    }
                    aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyDebounce.js"]});

                    const locMessages = await localStorage.getItem(`locale_messages`) || {};
                    if(!this.isChrome()){
                        aBrowser.tabs.executeScript(
                            tabId, { 
                                code: 'self._clockifyMessages = ' + JSON.stringify(locMessages)
                            }
                        ); 

                    }else {
                        aBrowser.scripting.executeScript(
                            {
                                target: {tabId},  
                                func: (locMessages) => { 
                                    self._clockifyMessages = locMessages;
                                },
                                args: [locMessages]
                            });   
                    }
                    aBrowser.scripting.executeScript({target: {tabId}, files: ["contentScripts/clockifyLocales.js"]});
                    const wsSettings = await localStorage.getItem("workspaceSettings");
                    if (wsSettings) {
                        const workspaceSettings = JSON.parse(wsSettings);
                        let showPostStartPopup = true;
                        aBrowser.storage.local.get('showPostStartPopup', (result) => {
                            if (typeof result.showPostStartPopup !== 'undefined') {
                                showPostStartPopup = result.showPostStartPopup;
                            }
                        });

                        if (showPostStartPopup) {
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyCustomField.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifySingleItem.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyMultipleItem.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyTagItem.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyTagList.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyProjectTaskList.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyProjectItem.js"]});
                            aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyProjectList.js"]}, () => {
                                aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyCustomFieldDropSingle.js"]});
                                aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyCustomFieldDropMultiple.js"]});
                                aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyPopupEditForm.js"]}, () => {
                                    aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyPopupDlg.js"]}, () => {
                                    if(!this.isChrome()){
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
                                                    projectPickerSpecialFilter: ${workspaceSettings.projectPickerSpecialFilter},
                                                    projectFavorites: ${workspaceSettings.projectFavorites},
                                                    activeBillableHours: ${workspaceSettings.activeBillableHours},
                                                    onlyAdminsCanChangeBillableStatus: ${workspaceSettings.onlyAdminsCanChangeBillableStatus},
                                                    features: ${JSON.stringify(workspaceSettings.features)}
                                                }`
                                            }); 
                                    } else {
                                        
                                        aBrowser.scripting.executeScript(
                                            {
                                                target: {tabId}, 
                                                func: (workspaceSettings) => {
                                                    ClockifyEditForm.prototype.wsSettings = {
                                                        forceDescription: workspaceSettings.forceDescription,
                                                        forceProjects: workspaceSettings.forceProjects,
                                                        forceTasks: workspaceSettings.forceTasks,
                                                        forceTags: workspaceSettings.forceTags,
                                                        projectPickerSpecialFilter: workspaceSettings.projectPickerSpecialFilter,
                                                        projectFavorites: workspaceSettings.projectFavorites,
                                                        activeBillableHours: workspaceSettings.activeBillableHours,
                                                        onlyAdminsCanChangeBillableStatus: workspaceSettings.onlyAdminsCanChangeBillableStatus,
                                                        features: workspaceSettings.features
                                                    }
                                                },
                                                args: [workspaceSettings]
                                            });

                                            aBrowser.scripting.executeScript(
                                                {
                                                    target: {tabId},  
                                                    func: (showPostStartPopup) => { 
                                                        _clockifyShowPostStartPopup = showPostStartPopup;
                                                    },
                                                    args: [showPostStartPopup]
                                                });   
                                            
                                    }
                                    });
                                    });
                            });
                        }
                    }                    

                    aBrowser.scripting.executeScript({target: {tabId}, files: ["popupDlg/clockifyButton.js"]}, () => {
                        loadScripts(tabId, domain.file);
                        setTimeout(() => {
                            backgroundWebSocketConnect();
                        }, 1000)
                    });
                }
            } 
            else {
                if (tab.url.includes(aBrowser.identity.getRedirectURL()) ) { // to use frontendUrl?
                    this.extractAndSaveToken(tab.url);
                    aBrowser.tabs.remove(tabId, () => {});
                }
            }
        });
    }
});

function loadScripts(tabId, file) {
    try {
        aBrowser.scripting.executeScript({target: {tabId}, files: ["integrations/" + file]});
    } catch (e) {
    }
}

async function extractDomain(url, permissions) {
    let domain, file;
    if (url.includes("://")) {
        domain = url.split('/')[2];
    } else {
        domain = url.split('/')[0];
    }

    domain = domain.split('/*')[0];
    domain = domain.split('/')[0];
    file = await getOriginFileName(domain, permissions);

    return {
        domain: domain,
        file: file,
        origins: [
            "*://" + domain + "/*"
        ]
    };
}


async function extractAndSaveToken(url) {
    const [token, refreshToken] = url.split("?")[1]
        .replace('accessToken=','')
        .replace('refreshToken=','')
        .split('&');
    await localStorage.setItem('token', token);
    await localStorage.setItem('refreshToken', refreshToken);
    await UserService.getAndStoreUser();
    setClockifyOriginsToStorage();
    
    const lang = await localStorage.getItem('lang');
    clockifyLocales.onProfileLangChange(lang);
    TimeEntry.getTimeEntries(1, 50).then(async (timeEntries) => {
        if(timeEntries && timeEntries.data){
            await localStorage.setItem('preData', {
                bgEntries: timeEntries.data.timeEntriesList,
                durationMap: timeEntries.data.durationMap,
                weekStatusMap: timeEntries.data.weekStatusMap
            });
        }
    });
    ProjectService.getProjectsWithFilter('', 1, 50).then(projects => {
        if(projects && projects.data){
            localStorage.setItem('preProjectList', {
                projectList: projects.data
            });
        }
    });
    TagService.getAllTagsWithFilter(1, 50).then(tags => {
        if(tags && tags.data && tags.data.length){
            localStorage.setItem('preTagsList', tags.data);
        }
    });
}


async function checkState(state) {
    const selfHosted = await localStorage.getItem('selfhosted_oAuthState');
    return !(
        state &&
        selfHosted &&
        selfHosted === atob(state)
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

async function getOriginFileName(domain, permissionsFromStorage) {
    const userId = await localStorage.getItem('userId');
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



self.addEventListener("online",  () => {
    aBrowser.runtime.sendMessage({eventName: 'STATUS_CHANGED_ONLINE'});
});

self.addEventListener("offline", () => {
    aBrowser.runtime.sendMessage({eventName: 'STATUS_CHANGED_OFFLINE'});
});

/*
    TODO List
    - implement getToken inside of fetch:get like in token-service.js (like we did in HttpWrapperService.get)
*/ 

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.eventName) {
        case 'takeTimeEntryInProgress':
            return ClockifyIntegration.takeTimeEntryInProgress(sendResponse);

        case 'endInProgress':
            return ClockifyIntegration.stopEntryInProgress(sendResponse);

        case 'startWithDescription':
            return ClockifyIntegration.startWithDescription(request, sendResponse);

        case 'getProjectsByIds':
            return ClockifyIntegration.getProjectsByIds(request, sendResponse); 
            
        case 'getDefaultProjectTask':
            return ClockifyIntegration.getDefaultProjectTask(sendResponse); 
    
        case 'getProjects':
            return ClockifyIntegration.getProjects(request, sendResponse); 

        case 'getProjectTasks':
            return ClockifyIntegration.getProjectTasks(request, sendResponse); 

        case 'submitDescription':
            return ClockifyIntegration.submitDescription(request, sendResponse); 

        case 'editProject':
            return ClockifyIntegration.editProject(request, sendResponse); 

        case 'editTask':
            return ClockifyIntegration.editTask(request, sendResponse); 
 
        case 'getTags':
            return ClockifyIntegration.getTags(request, sendResponse); 
 
        case 'editTags':
            return ClockifyIntegration.editTags(request, sendResponse); 
            
        case 'fetchEntryInProgress':
            return ClockifyIntegration.fetchEntryInProgress(sendResponse); 

        case 'removeProjectAsFavorite':
            return ClockifyIntegration.removeProjectAsFavorite(request, sendResponse); 

        case 'makeProjectFavorite':
            return ClockifyIntegration.makeProjectFavorite(request, sendResponse); 
        
        case 'editBillable':
            return ClockifyIntegration.editBillable(request, sendResponse);

        case 'submitTime':
            return ClockifyIntegration.submitTime(request, sendResponse);

        case 'getWSCustomField':
            return ClockifyIntegration.getWSCustomField(request, sendResponse); 

        case 'getUserRoles':
            return ClockifyIntegration.getUserRoles(request, sendResponse); 

        case 'submitCustomField':
            return ClockifyIntegration.submitCustomField(request, sendResponse); 
            
        case 'generateManualEntryData':
            return ClockifyIntegration.generateManualEntryData(request, sendResponse);
        default:
            return false;
    }
    return true; // keep port open for async
});



function startWithDescription(request) {
    return new Promise(async resolve => {
        const { entry, error } = await TimeEntry.getEntryInProgress();
        if (error) {
            resolve({ status: err.status})
            return;
        }

        if (entry) {
            const { error } = await TimeEntry.endInProgress();
            if (error) {
                resolve({ status: error.status})
                return;
            }
        }
        
        const { timeEntryOptions } = request;
        const {entry: ent, error: err} = await TimeEntry.startTimer(timeEntryOptions.description, timeEntryOptions);
        if (err) {
            resolve({ status: err.status });
            return;
        }
        if (ent.status === 201) {
            // proveri afterStartTimer
            // window.inProgress = true;
            aBrowser.action.setIcon({
                path: iconPathStarted
            });
            addPomodoroTimer();
        }   
        // { 
        //     status: response.status,
        //     data: (task ? Object.assign(json, { task: task }) : json)
        // }
        resolve({ status: ent.status, data: ent });
    });
}




// async function takeTimeEntryInProgress() {
//     if (TokenService.isLoggedIn) {
//         const { entry, error } = await TimeEntry.getEntryInProgress();
//         if (entry === null || error) {
//             setTimeEntryInProgress(null);
//             aBrowser.action.setIcon({
//                 path: iconPathEnded
//             });
//         }
//         else {
//             setTimeEntryInProgress(entry);
//             aBrowser.action.setIcon({
//                 path: iconPathStarted
//             });
//         }
//     }
// }


// UNSURE
// setTimeout(async () => {
//     await ClockifyIntegration.takeTimeEntryInProgress(() => {});
// }, 1000);


// setTimeout(async () => {
//     const { entry, error } = await TimeEntry.getEntryInProgress();
//     aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
//         const {timeEntryInProgress} = result;           
//         console.log('aBrowser.storage.local.get(["timeEntryInProgress"]', timeEntryInProgress);
//     });
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

