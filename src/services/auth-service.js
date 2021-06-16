import {HttpService} from "./http-service";
import {LocalStorageService} from "./localStorage-service";

const localStorageService = new LocalStorageService();
const httpService = new HttpService();

export class AuthService {

    constructor() { }

    signup(email, password, timeZone) {
        const baseUrl = localStorageService.get('baseUrl');
        const signupUrl = `${baseUrl}/auth/`;
        const subDomainName = localStorageService.get('subDomainName', null);
        const body = {
            key: email,
            secret: password,
            timeZone: timeZone
        };

        let headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'sub-domain-name': subDomainName
        };

        return httpService.post(signupUrl, body, headers)
    }
}