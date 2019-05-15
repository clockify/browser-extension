import {HttpService} from "./http-service";
import {TokenService} from "./token-service";

const httpService = new HttpService();
const tokenService = new TokenService();

export class HttpWrapperService {
    constructor() {}

    get(url, addToken) {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (addToken) {
            return tokenService.getToken().then(token => {
                if (token) {
                    headers['X-Auth-Token'] = '' + token;
                    return httpService.get(url, headers);
                } else {
                    tokenService.logout();
                }
            });
        }

        return httpService.get(url, headers);
    }

    put(url, body, addToken) {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (addToken) {
            return tokenService.getToken().then(token => {
                if (token) {
                    headers['X-Auth-Token'] = '' + token;
                    return httpService.put(url, body, headers);
                } else {
                    tokenService.logout();
                }
            });
        }
        return httpService.put(url, body, headers);
    }

    post(url, body, addToken) {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (addToken) {
            return tokenService.getToken().then(token => {
                if (token) {
                    headers['X-Auth-Token'] = '' + token;
                    return httpService.post(url, body, headers);
                } else {
                    tokenService.logout();
                }
            });
        }
        return httpService.post(url, body, headers);
    }

    delete(url, addToken) {
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        if (addToken) {
            return tokenService.getToken().then(token => {
                if (token) {
                    headers['X-Auth-Token'] = '' + token;
                    return httpService.delete(url, headers);
                } else {
                    tokenService.logout();
                }
            });
        }
        return httpService.delete(url, headers);
    }
}