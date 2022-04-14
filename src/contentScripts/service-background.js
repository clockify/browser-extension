async function isNavigatorOffline() {
    const offline = await localStorage.getItem('offline');
    if (offline)
        return JSON.parse(offline);
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


async function createHttpHeaders(token) {
    let headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['X-Auth-Token'] = token;
    }
    const wsConnectionId = await localStorage.getItem('wsConnectionId');
    if (wsConnectionId) {
        headers['socket-connection-id'] = wsConnectionId;
    }

    headers['App-Name'] = 'extension-' + isChrome() ? 'chrome' : 'firefox';

    const subDomainName = await localStorage.getItem('sub-domain_subDomainName');
    if (subDomainName) {
        headers['sub-domain-name'] = subDomainName;
    }

    const lang = await localStorage.getItem('lang');
    if(lang){
        headers['accept-language'] = lang;
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

    static async getForces() {
        const ws = await localStorage.getItem('workspaceSettings');
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

    static async getCreateObjects() {
        const str = await localStorage.getItem('permanent_createObjects');
        if (!str)
            return false;
        return JSON.parse(str);
    }

    static async  setOnline() {
        const storageOffline = await localStorage.getItem('offline');
        if (!storageOffline || storageOffline === 'true') {
            localStorage.setItem('offline', 'false');
        }
    }   

    static async setOffline() {
        const storageOffline = await localStorage.getItem('offline');
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

        const hdrs =  await createHttpHeaders(token);

        const headers = new Headers(hdrs);
    
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
                        return errorObj(400, `${clockifyLocales.YOU_ALREADY_HAVE_ENTRY_WITHOUT}. ${clockifyLocales.PLEASE_EDIT_YOUR_TIME_ENTRY}.`);
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
        const apiEndpoint = await this.apiEndpoint;
        const endPoint = `${apiEndpoint}/health`;
        const { error } = await this.apiCall(endPoint);
        return !error;
    }

}