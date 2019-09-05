function getLastUsedProject() {
    const apiEndpoint = localStorage.getItem('permanent_baseUrl');
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const token = localStorage.getItem('token');

    const getLastUsedUrl = `${apiEndpoint}/workspaces/${activeWorkspaceId}/projects/last-used`;

    const headers = new Headers(this.createHttpHeaders(token));

    let lastUsedProjectRequest = new Request(getLastUsedUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(lastUsedProjectRequest);
}