import {LocalStorageService} from "../services/localStorage-service";
import {isChrome} from "./browser-helper";

const localStorageService = new LocalStorageService();

export class HttpHeadersHelper {

    constructor(){}

    async createHttpHeaders(token) {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['X-Auth-Token'] = token;
        }

        const wsConnectionId = await localStorageService.get('wsConnectionId');
        const subDomainName = await localStorageService.get('subDomainName');

        if (wsConnectionId) {
            headers['socket-connection-id'] = wsConnectionId;
        }
        let appType = 'extension';
        if (isChrome()) {
            appType += '-chrome';
        } else {
            appType += '-firefox';
        }

        if (subDomainName) {
            headers['sub-domain-name'] = subDomainName;
        }

        headers['App-Name'] = appType;
        const lang = localStorageService.get('lang');
        if(lang){
            headers['accept-language'] = lang;
        }

        return headers;
    }
}