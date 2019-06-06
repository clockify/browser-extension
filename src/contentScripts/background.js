let aBrowser = chrome || browser;
const iconPathEnded = '../assets/images/logo-16-gray.png';
const iconPathStarted = '../assets/images/logo-16.png';
const clockifyProd = 'https://clockify.me/tracker';

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

aBrowser.commands.onCommand.addListener((command) => {
    const activeWorkspaceId = localStorage.getItem("activeWorkspaceId");
    const token = localStorage.getItem('token');
    if (isLoggedIn()) {
        if (command === commands.startStop) {
            getInProgress(activeWorkspaceId, token)
                .then(response => response.json())
                .then(data => {
                    endInProgress(activeWorkspaceId, token)
                        .then(response => {
                            if (response.status === 400) {
                                alert("You already have entry in progress which can't be saved" +
                                    " without project/task/description or tags. Please edit your time entry.");
                            } else {
                                window.inProgress = false;
                                aBrowser.browserAction.setIcon({
                                    path: iconPathEnded
                                });
                            }
                        });
                })
                .catch(error => {
                    startTimer(activeWorkspaceId, token, "");
                })
        }
    } else {
        alert('You must log in to use keyboard shortcut');
    }
});

aBrowser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    aBrowser.storage.local.get('permissions', (result) => {
        let domain = extractDomain(tab.url, result.permissions);

        if (tab.status === tabStatus.COMPLETE) {
            if (!tab.url.includes("chrome://") && isLoggedIn()) {
                if (!!domain.file) {
                    aBrowser.tabs.insertCSS(tabId, {file: "integrations/style.css"});
                    aBrowser.tabs.executeScript(tabId, {file: "integrations/button.js"}, () => {
                        loadScripts(tabId, domain.file);
                    });
                }
            } else if (tab.url.includes(aBrowser.identity.getRedirectURL())) {
                const token  = extractToken(tab.url);
                refreshToken(token, tab.id);
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
        token = url.split('?')[1].split('=')[1];
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
        param = params.split("&").filter(param => param.includes(paramName))
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

function startTimerWithDescription(info) {
    let token;
    let activeWorkspaceId;
    aBrowser.storage.sync.get(['token', 'activeWorkspaceId'], function (result) {
        token = result.token;
        activeWorkspaceId = result.activeWorkspaceId;

        getInProgress(activeWorkspaceId, token)
            .then(response => response.json())
            .then(data => {
                endInProgressAndStartNew(info);
            })
            .catch(error => {
                startTimer(activeWorkspaceId, token, info ? info.selectionText : "");
            })
    });
}

function loginWithCode(code, state, nonce, redirectUri) {
    const baseUrl = localStorage.getItem('permanent_baseUrl');
    const loginWithCodeUrl = `${baseUrl}/auth/code`;

    let loginWithCodeRequest = new Request(loginWithCodeUrl, {
        method: 'POST',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            code: code,
            timeZone: null,
            state: state,
            nonce: nonce,
            redirectURI: redirectUri
        })
    });

    return fetch(loginWithCodeRequest);
}

function fetchUser(userId) {
    const baseUrl = localStorage.getItem('permanent_baseUrl');
    const userUrl = `${baseUrl}/users/${userId}`;

    let getUserRequest = new Request(userUrl, {
        method: 'GET',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Auth-Token': localStorage.getItem('token')
        })
    });

    return fetch(getUserRequest).then(response => response.json());
}

function endInProgressAndStartNew(info) {
    aBrowser.storage.sync.get(['token', 'activeWorkspaceId'], (result) => {
        let token = result.token;
        let activeWorkspaceId = result.activeWorkspaceId;
        endInProgress(activeWorkspaceId, token)
            .then(response => response.json())
            .then(data => {
                if (data.code === 501) {
                    alert("You already have entry in progress which can't be saved without project/task/description or tags. Please edit your time entry.")
                } else {
                    startTimer(activeWorkspaceId, token, info && info.selectionText ? info.selectionText : "");
                }
            })
            .catch(() => {
                aBrowser.browserAction.setIcon({
                    path: iconPathEnded
                });
            });
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

function endInProgress(activeWorkspaceId, token) {
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

    return fetch(endRequest);
}

function getInProgress(activeWorkspaceId, token) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    let inProgressUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/timeEntries/inProgress`;
    let timeEntryInProgressRequest = new Request(inProgressUrl, {
        method: 'GET',
        headers: new Headers({
            'X-Auth-Token': token
        })
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
                loginWithCode(code, stateFromUrl, request.nonce, request.redirectUri)
                    .then(response => response.json())
                    .then(data => {
                    aBrowser.storage.sync.set({
                        token: (data.token),
                        userId: (data.id),
                        refreshToken: (data.refreshToken),
                        userEmail: (data.email)
                    });
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('userId', data.id);
                    localStorage.setItem('userEmail', data.email);

                    fetchUser(data.id).then(data => {
                        aBrowser.storage.sync.set({
                            activeWorkspaceId: (data.activeWorkspace),
                            userSettings: (JSON.stringify(data.settings))
                        });
                        localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                        localStorage.setItem('userSettings', JSON.stringify(data.settings));

                        sendResponse(true);
                    });
                });
            }
        }
    );
}

function saml2Login(request) {
    aBrowser.tabs.create(
        {url: aBrowser.runtime.getURL("saml2extension.html")},
        (tab) => {
            let handler = (tabId, changeInfo) => {

                if(tabId === tab.id && changeInfo.status === "complete"){
                    aBrowser.tabs.onUpdated.removeListener(handler);
                    aBrowser.tabs.sendMessage(
                        tabId,
                        {
                            url: request.saml2Url,
                            SAMLRequest: request.saml2Request,
                            RelayState: aBrowser.identity.getRedirectURL()
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
                    RelayState: aBrowser.identity.getRedirectURL()
                }
            );
        }
    );
}

function refreshToken(token, tabId) {
    const endpoint = localStorage.getItem('permanent_baseUrl');
    const refreshTokenUrl = `${endpoint}/auth/token/refresh`;

    let refreshTokenRequest = new Request(refreshTokenUrl, {
        method: 'POST',
        headers: new Headers({
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            refreshToken: token
        })
    });

    fetch(refreshTokenRequest).then(response => response.json()).then(data => {
        aBrowser.storage.sync.set({
            token: (data.token),
            userId: (data.id),
            refreshToken: (data.refreshToken),
            userEmail: (data.email)
        });
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userEmail', data.email);

        fetchUser(data.id).then(data => {
            aBrowser.storage.sync.set({
                activeWorkspaceId: (data.activeWorkspace),
                userSettings: (JSON.stringify(data.settings))
            });
            localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
            localStorage.setItem('userSettings', JSON.stringify(data.settings));
        });
    });
}

