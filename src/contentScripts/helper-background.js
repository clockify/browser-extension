function createHttpHeaders(token) {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['X-Auth-Token'] = token;
    }

    if (localStorage.getItem('wsConnectionId')) {
        headers['socket-connection-id'] = localStorage.getItem('wsConnectionId');
    }

    let appName = this.createAppName();

    headers['App-Name'] = appName;

    if (localStorage.getItem('sub-domain_subDomainName')) {
        headers['sub-domain-name'] = localStorage.getItem('sub-domain_subDomainName');
    }

    return headers;
}

function createAppName() {
    let appName = 'extension-';

    if (this.isChrome()) {
        appName += 'chrome';
    } else {
        appName += 'firefox';
    }

    return appName;
}

function isChrome() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return false;
        } else {
            return true;
        }
    }
}

function isOffline() {
    return !navigator.onLine;
}

function getDefaultProject() {
    if (this.isOffline()) {
        return Promise.resolve(null);
    }
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const userId = localStorage.getItem('userId');
    const defaultProjects = this.getDefaultProjectListFromStorage();

    if (defaultProjects && defaultProjects.length === 0) {
        return Promise.resolve(null);
    }

    const defaultProjectForWorkspaceAndUser =
        this.filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId);

    if (!defaultProjectForWorkspaceAndUser || !defaultProjectForWorkspaceAndUser.enabled) {
        return Promise.resolve(null);
    }

    if (
        defaultProjectForWorkspaceAndUser &&
        defaultProjectForWorkspaceAndUser.project &&
        defaultProjectForWorkspaceAndUser.project.id === 'lastUsedProject'
    ) {
        return this.getLastUsedProjectFromTimeEntries();
    }

    return this.isDefaultProjectAvailableToUser(defaultProjectForWorkspaceAndUser.project).then(available => {
        return available ? defaultProjectForWorkspaceAndUser.project : null;
    });
}

function getDefaultProjectListFromStorage() {
    let defaultProjects = localStorage.getItem('permanent_defaultProjects');

    return defaultProjects ? JSON.parse(defaultProjects) : [];
}

function filterProjectsByWorkspaceAndUser(defaultProjects, activeWorkspaceId, userId) {
    return defaultProjects && defaultProjects.filter(defProject =>
        defProject.workspaceId === activeWorkspaceId && defProject.userId === userId).length > 0 ?
        defaultProjects.filter(defProject =>
            defProject.workspaceId === activeWorkspaceId && defProject.userId === userId)[0] : null;
}

function isDefaultProjectAvailableToUser(project) {
    if (!project) {
        return Promise.resolve(false);
    }
    const userId = localStorage.getItem('userId');
    return this.getPermissionsForUser().then(response => response.json()).then(workspacePermissions => {

        if (project.archived) {
            return false;
        }

        const filteredWorkspacePermissions = workspacePermissions.filter(permission =>
            permission.name === 'WORKSPACE_OWN' ||
            permission.name === 'WORKSPACE_ADMIN'
        );
        const projectMemberships = project.memberships.filter(membership =>
            membership.membershipStatus === "ACTIVE" && membership.userId === userId);
        if (filteredWorkspacePermissions.length > 0 ||
            projectMemberships.length > 0 ||
            project.public) {
            return true;
        }
        return false;
    });
}

function getLastUsedProjectFromTimeEntries() {
    return this.getLastUsedProject().then(response => response.json()).then(data => {
        if (data.length > 0) {
            return data[0];
        } else {
            return Promise.resolve(null);
        }
    });
}

function refreshTokenAndFetchUser(token) {
    this.refreshToken(token).then(response => response.json()).then(data => {
        aBrowser.storage.local.set({
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
            aBrowser.storage.local.set({
                activeWorkspaceId: (data.activeWorkspace),
                userSettings: (JSON.stringify(data.settings))
            });
            localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
            localStorage.setItem('userSettings', JSON.stringify(data.settings));
        });
    });
}

function loginWithCodeAndFetchUser(code, stateFromUrl, nonce, redirectUri, sendResponse) {
    this.loginWithCode(code, stateFromUrl, nonce, redirectUri)
        .then(response => response.json())
        .then(data => {
            aBrowser.storage.local.set({
                token: (data.token),
                userId: (data.id),
                refreshToken: (data.refreshToken),
                userEmail: (data.email)
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userEmail', data.email);

            this.fetchUser(data.id).then(data => {
                aBrowser.storage.local.set({
                    activeWorkspaceId: (data.activeWorkspace),
                    userSettings: (JSON.stringify(data.settings))
                });
                localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                localStorage.setItem('userSettings', JSON.stringify(data.settings));

                sendResponse(true);
            });
        });
}

function fetchUser(userId) {
    const baseUrl = localStorage.getItem('permanent_baseUrl');
    const userUrl = `${baseUrl}/users/${userId}`;
    const headers = new Headers(this.createHttpHeaders(localStorage.getItem('token')));

    let getUserRequest = new Request(userUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(getUserRequest).then(response => response.json());
}

function loginWithCode(code, state, nonce, redirectUri) {
    const baseUrl = localStorage.getItem('permanent_baseUrl');
    const loginWithCodeUrl = `${baseUrl}/auth/code`;

    let loginWithCodeRequest = new Request(loginWithCodeUrl, {
        method: 'POST',
        headers: new Headers(this.createHttpHeaders()),
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