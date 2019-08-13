import {HttpService} from "./http-service";
import {TokenService} from "./token-service";
import {HttpHeadersHelper} from "../helpers/http-headers-helper";

const httpService = new HttpService();
const tokenService = new TokenService();
const httpHeadersHelper = new HttpHeadersHelper();

export class HttpWrapperService {
    constructor() {}

    get(url, addToken) {
        let headers = httpHeadersHelper.createHttpHeaders();

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
        let headers = httpHeadersHelper.createHttpHeaders();

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
        let headers = httpHeadersHelper.createHttpHeaders();

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
        let headers = httpHeadersHelper.createHttpHeaders();

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