async function getLastUsedProject() {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');

    const getLastUsedUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/projects/last-used`;

    const headers = new Headers(this.createHttpHeaders(token));

    let lastUsedProjectRequest = new Request(getLastUsedUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(lastUsedProjectRequest).then(response => {
        if (response.status === 201 && response.json().length > 0) {
            return response.json()[0];
        } else {
            return null;
        };
    });
}

async function getProjectsByIds(projectIds) {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');

    const projectUrl =
            `${apiEndpoint}/workspaces/${activeWorkspaceId}/projects/ids`;
    const body = JSON.stringify({
        ids: projectIds
    });

    const headers = new Headers(this.createHttpHeaders(token));
    
    let projectRequest = new Request(projectUrl, {
        method: 'POST',
        headers: headers,
        body: body
    });

    return fetch(projectRequest).then(response => {
        if (response.status === 201 && response.json().length > 0) {
            return response.json()[0];
        } else {
            return null;
        }
    })
}