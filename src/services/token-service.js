import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Login from '../components/login.component';
import * as jwt from 'jsonwebtoken';
import {getBrowser} from "../helpers/browser-helper";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {HttpService} from "./http-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const httpService = new HttpService();

export class TokenService {

    constructor() {
    }

    getToken() {
        const token = localStorageService.get('token');

        if (this.isTokenValid(token)) {
            return Promise.resolve(token);
        }

        const refreshToken = localStorageService.get('refreshToken');

        if (this.isTokenValid(refreshToken)) {

            return this.refreshToken(refreshToken)
                .then(response => {
                    let data = response.data;
                    if (isAppTypeExtension()) {
                        getBrowser().storage.sync.set({
                            token: (data.token),
                            userId: (data.userId),
                            refreshToken: (data.refreshToken),
                            userEmail: (data.userEmail)
                        });
                    }
                    localStorageService.set('token', data.token);
                    localStorageService.set('refreshToken', data.refreshToken);
                    localStorageService.set('userId', data.id);
                    localStorageService.set('userEmail', data.email);
                    return response.data.token;
                })
        }

        return new Promise((resolve, reject) => {
            resolve();
        });
    }

    refreshToken(refreshToken) {
        const baseUrl = localStorageService.get('baseUrl');
        const refreshTokenUrl = `${baseUrl}/auth/token/refresh`;
        const body = {
            refreshToken: refreshToken
        };
        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        return httpService.post(refreshTokenUrl, body, headers);
    }

    isTokenValid(token) {
        if (!token || token === 'undefined' || token === 'null') {
            return false;
        }
        const decodedToken = jwt.decode(token, {complete: true});
        const timeNow = new Date();

        return decodedToken.payload.exp > timeNow / 1000;
    }

    logout() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<Login logout={true}/>, document.getElementById('mount'));
    }

    isLoggedIn() {
        return localStorageService.get('token') !== null && localStorageService.get('token') !== undefined;
    }
}