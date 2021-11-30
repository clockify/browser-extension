function isNavigatorOffline() {
    if (localStorage.getItem('offline'))
        return JSON.parse(localStorage.getItem('offline'));
    else
        return true;
}


function isChrome() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return false;
        } else {
            return true;
        }
    }
    return false;
}


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

    headers['App-Name'] = 'extension-' + isChrome() ? 'chrome' : 'firefox';

    if (localStorage.getItem('sub-domain_subDomainName')) {
        headers['sub-domain-name'] = localStorage.getItem('sub-domain_subDomainName');
    }

    return headers;
}

function errorObj(status, message) {
    return {
        data: null,
        error: {
            status,
            message
        }
    }
}

class ClockifyService {

    constructor() {
    }

    static get userId() {
        return localStorage.getItem('userId');
    }

    static get workspaceId() {
        return localStorage.getItem('activeWorkspaceId');
    }

    static get apiEndpoint() {
        return localStorage.getItem('permanent_baseUrl');
    }

    static get forces() {
        const ws = localStorage.getItem('workspaceSettings');
        const wsSettings = ws ? JSON.parse(ws) : {
            forceDescription: false,
            forceProjects: false,
            forceTasks: false,
            projectPickerSpecialFilter: false,
            forceTags: false
        };
        const { forceDescription, forceProjects, forceTasks, projectPickerSpecialFilter, forceTags } = wsSettings;
        return { 
            forceDescription,
            forceProjects,
            forceTasks,
            projectPickerSpecialFilter,
            forceTags
        }
    }

    static get createObjects() {
        const str = localStorage.getItem('permanent_createObjects');
        if (!str)
            return false;
        return JSON.parse(str);
    }

    static setOnline() {
        const storageOffline = localStorage.getItem('offline');
        if (!storageOffline || storageOffline === 'true') {
            localStorage.setItem('offline', 'false');
        }
    }   

    static setOffline() {
        const storageOffline = localStorage.getItem('offline');
        if (!storageOffline || storageOffline === 'false') {
            localStorage.setItem('offline', 'true');
        }
    }   


    static async apiCall(endpoint, method='GET', body=null, withNoToken=false)
    {
        let token;
        // TREBA LI SVAKI apiCall da ima TOKEN
        if (withNoToken) {
            token = null;
        }
        else {
            token = await TokenService.getToken();
            if (!token) {
                console.log('token is missing');
                return errorObj('0', 'token is missing')
            }
        }

        const headers = new Headers(createHttpHeaders(token));
    
        const request = new Request(endpoint, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : null
                })  


        // TODO Take care request failed, probably because of wrong permissions
        return await fetch(request)
            .then(async response => {
                if (response.type === 'error') {
                    this.setOffline();
                    // return Network errors
                }
                else {
                    this.setOnline();
                }

                switch(response.status)  {
                    case 400:
                    case 501:
                        return errorObj(400, "You already have entry in progress which can't be saved without project/task/description or tags. Please edit your time entry.");
                    case 403:
                        // logout()
                        // window.location.assign(window.location)
                        return errorObj(response.status, 'Unauthenticated');
                    case 404:
                        return errorObj(response.status, 'Not found');
                    case 405:
                        return errorObj(response.status, 'Method not allowed');
                    case 401:
                        return errorObj(response.status, 'Forbidden');
                    default:
                        // fall through 
                }
                if (response.ok) {
                    let data;
                    try {
                        data = await response.json();
                    }
                    catch {
                        data = null;
                    }
                    return { data, error: null, status: response.status };
                } 
                else {
                    const errorMessage = await response.text()
                    return errorObj(response.status, errorMessage);
                }
            })
            .catch(error => {
                // TODO
                // this.setOffline();
                console.error('There has been a problem with your fetch operation: ', error); // error.message
            });
    }

    static async healthCheck() {
        const endPoint = `${this.apiEndpoint}/health`;
        const { error } = await this.apiCall(endPoint);
        return !error;
    }

}