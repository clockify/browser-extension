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

aBrowser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        aBrowser.tabs.create({'url': clockifyProd});
        aBrowser.browserAction.setIcon({
            path: iconPathEnded
        });
    }
});

aBrowser.windows.onCreated.addListener((window) => {
    if (this.isLoggedIn() && windowIds.length === 0) {
        this.getEntryInProgress()
            .then(response => response.json())
            .then(data => {
                this.entryInProgressChangedEventHandler(data);
                aBrowser.browserAction.setIcon({
                    path: iconPathStarted
                });
            }).catch(() => {
                this.addReminderTimerOnStartingBrowser();
                this.startTimerOnStartingBrowser();
                this.entryInProgressChangedEventHandler(null);
                aBrowser.browserAction.setIcon({
                    path: iconPathEnded
                });
            });
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
        this.endInProgressOnClosingBrowser();
        this.disconnectWebSocket();
        this.restartPomodoro();
    }
});

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch(request.eventName) {
        case 'oAuthLogin':
            this.oAuthLogin(request, sendResponse);
            break;
        case 'saml2Login':
            this.saml2Login(request);
    }
});

fetch("integrations/integrations.json")
    .then(response => response.json())
    .then(data => {
        window.ClockifyOrigins = data;
    });

aBrowser.contextMenus.removeAll();
aBrowser.contextMenus.create({
    "title": "Start timer with description '%s'",
    "contexts": ["selection"],
    "onclick": this.startTimerWithDescription
});
aBrowser.contextMenus.create({
    "title": "Start timer",
    "contexts": ["page"],
    "onclick": this.startTimerWithDescription
});

aBrowser.commands.onCommand.addListener(async (command) => {
    const activeWorkspaceId = localStorage.getItem("activeWorkspaceId");
    const token = localStorage.getItem('token');
    const timerShortcutFromStorage = localStorage.getItem('permanent_timerShortcut');
    const userId = localStorage.getItem('userId');
    const isTimerShortcutOn = timerShortcutFromStorage && JSON.parse(timerShortcutFromStorage)
        .filter(timerShortcutByUser =>
            timerShortcutByUser.userId === userId && JSON.parse(timerShortcutByUser.enabled)).length > 0;

    if (!isTimerShortcutOn) return
    if (command !== commands.startStop) return
    if (!isLoggedIn()) {
        alert('You must log in to use keyboard shortcut');
        return
    }

    getInProgress(activeWorkspaceId, token)
        .then(response => response.json())
        .then(data => {
            if (!data.projectId) {
                const defaultProject = this.getDefaultProject();
                if (defaultProject && !defaultProject.archived) {
                    this.updateProject(defaultProject.id, data.id)
                        .then(response => response.json())
                        .then(data => {
                            this.endInProgress(new Date())
                                .then(response => {
                                    if (response.status === 400) {
                                        alert("You already have entry in progress which can't be saved" +
                                            " without project/task/description or tags. Please edit your time entry.");
                                    } else {
                                        window.inProgress = false;
                                        aBrowser.browserAction.setIcon({
                                            path: iconPathEnded
                                        });
                                        aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STOPPED'});
                                    }
                                });
                        });
                }
            } else {
                this.endInProgress(new Date())
                    .then(response => {
                        if (response.status === 400) {
                            alert("You already have entry in progress which can't be saved" +
                                " without project/task/description or tags. Please edit your time entry.");
                        } else {
                            window.inProgress = false;
                            aBrowser.browserAction.setIcon({
                                path: iconPathEnded
                            });
                            aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STOPPED'});
                        }
                });
            }
        })
        .catch(error => {
            startTimerBackground(activeWorkspaceId, token, "");
        })
});

aBrowser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url.includes("clockify.me")) return
    aBrowser.storage.local.get('permissions', (result) => {
        let domain = extractDomain(tab.url, result.permissions);

        if (changeInfo.status === "complete") {
            if (!tab.url.includes("chrome://") && isLoggedIn()) {
                if (!!domain.file) {
                    aBrowser.tabs.insertCSS(tabId, {file: "integrations/style.css"});
                    aBrowser.tabs.executeScript(tabId, {file: "integrations/button.js"}, (firstLoad) => {
                        loadScripts(tabId, domain.file);
                    });
                }
            } else if (tab.url.includes(aBrowser.identity.getRedirectURL())) {
                const token  = extractToken(tab.url);
                this.refreshTokenAndFetchUser(token);
                aBrowser.tabs.remove(tabId, () => {});
            }
        }
    });
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

function extractToken(url) {
    let token = "";

    if (!!url) {
        token = url.split('?')[1].split('=')[1]
    }

    return token;
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

async function startTimerWithDescription(info) {
    let token;
    let activeWorkspaceId;
    aBrowser.storage.local.get(['token', 'activeWorkspaceId'], async function (result) {
        token = result.token;
        activeWorkspaceId = result.activeWorkspaceId;

        getInProgress(activeWorkspaceId, token)
            .then(response => response.json())
            .then(data => {
                if (!data.projectId) {
                    const defaultProject = this.getDefaultProject()
                    if (defaultProject && !defaultProject.archived) {
                        this.updateProject(defaultProject.id, data.id)
                            .then(response => response.json())
                            .then(data => {
                                endInProgressAndStartNew(info);
                            });
                    }
                }
                endInProgressAndStartNew(info);
            })
            .catch(error => {
                startTimerBackground(activeWorkspaceId, token, info ? info.selectionText : "");
            })
    });
}

function endInProgressAndStartNew(info) {
    aBrowser.storage.local.get(['token', 'activeWorkspaceId'], (result) => {
        let token = result.token;
        let activeWorkspaceId = result.activeWorkspaceId;
        this.endInProgress(new Date())
            .then(response => response.json())
            .then(data => {
                if (data.code === 501) {
                    alert("You already have entry in progress which can't be saved without project/task/description or tags. Please edit your time entry.")
                } else {
                    this.entryInProgressChangedEventHandler(null);
                    aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STOPPED'});
                    startTimerBackground(activeWorkspaceId, token, info && info.selectionText ? info.selectionText : "");
                }
            })
            .catch(() => {
                aBrowser.browserAction.setIcon({
                    path: iconPathEnded
                });
            });
    });
}

async function startTimerBackground(activeWorkspaceId, token, description) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    let timeEntryUrl =
        `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/`;
    const headers = new Headers(this.createHttpHeaders(token));

    const defaultProject = this.getDefaultProject()
    let timeEntryRequest = new Request(timeEntryUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            start: new Date(),
            description: description,
            billable: false,
            projectId: 
                defaultProject && !defaultProject.archived ? 
                    defaultProject.id : null,
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
                this.entryInProgressChangedEventHandler(data);
                aBrowser.runtime.sendMessage({eventName: 'TIME_ENTRY_STARTED'});
            }

        })
        .catch(error => {
        })
}

function getInProgress(activeWorkspaceId, token) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    let inProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/inProgress`;
    const headers = new Headers(this.createHttpHeaders(token));

    let timeEntryInProgressRequest = new Request(inProgressUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(timeEntryInProgressRequest);
}

function oAuthLogin(request, sendResponse) {
    aBrowser.identity.launchWebAuthFlow(
        {'url': request.oAuthUrl, 'interactive': true},
        (redirect_url) => {
            const decodedUrl = decodeURIComponent(redirect_url);
            const params = decodedUrl.split("?")[1];
            const code = getParamFromUrl(params, 'code');
            const stateFromUrl = getParamFromUrl(params, 'state');

            if (stateFromUrl && this.checkState(stateFromUrl)) {
                return;
            }

            localStorage.removeItem('selfhosted_oAuthState');

            if (code && stateFromUrl) {
                this.loginWithCodeAndFetchUser(
                    code, stateFromUrl, request.nonce, request.redirectUri, sendResponse);
            }
        }
    );
}

function saml2Login(request) {
    aBrowser.tabs.create(
        {url: aBrowser.runtime.getURL("saml2extension.html")},
        (tab) => {
            const subDomainName = localStorage.getItem('sub-domain_subDomainName') ?
                localStorage.getItem('sub-domain_subDomainName') : null;
            let relayState;
            if (subDomainName) {
                relayState = JSON.stringify({
                    location: aBrowser.identity.getRedirectURL(),
                    organizationName: subDomainName
                });
            } else {
                relayState = aBrowser.identity.getRedirectURL();
            }

            let handler = (tabId, changeInfo) => {
                if(tabId === tab.id && changeInfo.status === "complete"){
                    aBrowser.tabs.onUpdated.removeListener(handler);
                    aBrowser.tabs.sendMessage(
                        tabId,
                        {
                            url: request.saml2Url,
                            SAMLRequest: request.saml2Request,
                            RelayState: relayState
                        }
                    );
                }
            };
            aBrowser.tabs.onUpdated.addListener(handler);
            aBrowser.tabs.sendMessage(
                tab.id,
                {
                    url: request.saml2Url,
                    SAMLRequest: request.saml2Request,
                    RelayState: relayState
                }
            );
        }
    );
}