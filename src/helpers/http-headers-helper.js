import {LocalStorageService} from "../services/localStorage-service";
import {isChrome} from "./browser-helper";

const localStorageService = new LocalStorageService();

export class HttpHeadersHelper {

    constructor(){}

    createHttpHeaders(token) {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['X-Auth-Token'] = token;
        }

        if (localStorageService.get('wsConnectionId')) {
            headers['socket-connection-id'] = localStorageService.get('wsConnectionId');
        }

        let appType = localStorageService.get('appType');

        if (appType === 'extension') {
            if (isChrome()) {
                appType += '-chrome';
            } else {
                appType += '-firefox';
            }
        }

        if (appType === 'mobile') {
            appType += '-android';
        }

        headers['App-Name'] = appType;

        return headers;
    }
}