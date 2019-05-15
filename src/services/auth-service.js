import {HttpService} from "./http-service";
import {LocalStorageService} from "./localStorage-service";
import * as moment from 'moment-timezone';

const localStorageService = new LocalStorageService();
const httpService = new HttpService();

export class AuthService {

    constructor() { }

    loginWithGoogle(provider, idToken, email, timeZone) {
        const baseUrl = localStorageService.get('baseUrl');
        const googleUrl = `${baseUrl}/auth/google`;
        const body = {
            provider: provider,
            token: idToken,
            email: email,
            timeZone:  timeZone
        };

        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        return httpService.post(googleUrl, body, headers);
    }

    loginWithCode(code, state, nonce, redirectUrl) {
        const baseUrl = localStorageService.get('baseUrl');
        const loginWithCodeUrl = `${baseUrl}/auth/code`;
        const body = {
            code: code,
            timeZone: moment.tz.guess(),
            state: state,
            nonce: nonce,
            redirectURI: redirectUrl
        };

        return httpService.post(loginWithCodeUrl, body);
    }

    signup(email, password, timeZone) {
        const baseUrl = localStorageService.get('baseUrl');
        const signupUrl = `${baseUrl}/auth/`;
        const body = {
            key: email,
            secret: password,
            timeZone: timeZone
        };

        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        return httpService.post(signupUrl, body, headers)
    }
}