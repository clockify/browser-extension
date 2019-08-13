import {getEnv} from "../environment";
import {getBrowser} from "../helpers/browser-helper";
import {TokenService} from "../services/token-service";

const environment = getEnv();
const tokenService = new TokenService();

export class WebSocketClient {
    constructor() {
        this.connection = "";
    }

    connect() {
        this.connectionId =
            `/${environment.webSocket.clientId}/` +
            `${localStorage.getItem('userEmail')}/` +
            `${Math.random().toString(36).substring(2, 10)}`;
        if (this.connection) {
            return;
        }

        this.connection = new WebSocket(`${environment.webSocket.endpoint}${this.connectionId}`);

        this.connection.onopen = (event) => {
            if (event.type === 'open') {
                tokenService.getToken().then(token => {
                    if (!!token) {
                        this.authenticate(token);
                    }
                });
            }
        };

        this.connection.onclose = () => {
            const getReconnectTimeout = () => {
                const min = 20 * 1000;
                const max = 150 * 1000;

                return Math.floor(Math.random() * (max - min + 1)) + min;
            };

            setTimeout(() => this.connect(), getReconnectTimeout());
        };

        this.connection.onmessage = (message) => {
            this.messageHandler(message);
        };
    }

    disconnect() {
        if (this.connection) {
            this.connection.close();
        }
    }

    messageHandler(event) {
        getBrowser().runtime.sendMessage({eventName: event.data});
    };

    authenticate(token) {
        if (!this.connection) return;
        if (token) {
            this.connection.send(token);
        } else {
            setTimeout(() => this.authenticate(), 10000);
        }
    }
}