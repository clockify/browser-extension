function getPermissionsForUser() {
    const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
    const userId = localStorage.getItem('userId');
    const baseUrl = localStorage.getItem('permanent_baseUrl');
    const token = localStorage.getItem('token');
    const workspacePermissionsUrl =
        `${baseUrl}/workspaces/${activeWorkspaceId}/users/${userId}/permissions`;


    const headers = new Headers(this.createHttpHeaders(token));

    let workspacePermissionsRequest = new Request(workspacePermissionsUrl, {
        method: 'GET',
        headers: headers
    });

    return fetch(workspacePermissionsRequest);
}