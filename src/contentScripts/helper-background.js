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