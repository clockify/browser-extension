import {HttpService} from "./http-service";
import {TokenService} from "./token-service";
import {HttpHeadersHelper} from "../helpers/http-headers-helper";

const httpService = new HttpService();
const tokenService = new TokenService();
const httpHeadersHelper = new HttpHeadersHelper();

export class HttpWrapperService {
    constructor() {}

    async get(url, addToken) {
        let headers = await httpHeadersHelper.createHttpHeaders();

        if (addToken) {
            return tokenService.getToken().then(token => {
                if (token) {
                    headers['X-Auth-Token'] = '' + token;
                    return httpService.get(url, headers)
                        .then(async response => {
                            const offline = await localStorage.getItem('offline');
                            if (offline === 'true') {
                                localStorage.setItem('offline', 'false');
                            }
                            return Promise.resolve(response);
                        })
                        .catch(error => {
                            if (error && !error.response) {
                                localStorage.setItem('offline', 'true');
                            }
                            return Promise.reject(error);
                        })
                } else {
                    tokenService.logout();
                }
            });
        }

        return httpService.get(encodeURI(url), headers);
    }

    async put(url, body, addToken) {
        let headers = await httpHeadersHelper.createHttpHeaders();

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
        return httpService.put(encodeURI(url), body, headers);
    }

    async post(url, body, addToken) {
        let headers = await httpHeadersHelper.createHttpHeaders();

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
        return httpService.post(encodeURI(url), body, headers);
    }

    async delete(url, addToken) {
        let headers = await httpHeadersHelper.createHttpHeaders();

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

        return httpService.delete(encodeURI(url), headers);
    }
}