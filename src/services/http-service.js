import * as axios from 'axios';

export class HttpService {

    constructor() {}

    get(url, headers) {
        return axios.get(url, {headers: headers});
    }

    put(url, body, headers) {
        return axios.put(url, body, {headers: headers});
    }

    post(url, body, headers) {
        return axios.post(url, body, {headers: headers});
    }

    delete(url, headers) {
        return axios.delete(url, {headers: headers});
    }
}