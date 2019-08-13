import { init as initApm } from 'elastic-apm-js-base';
let apm;

export class MetricsService {

    /**
     *
     * @param config
     * serviceName
     * serviceUrl
     * isEnabled,
     * userId,
     * userEmail
     */
    constructor(config) {
        if (config) {
            this.config = config;
        }
    }

    init() {
        apm = initApm({
            serviceName: this.config.serviceName,
            serverUrl: this.config.serverUrl,
            serviceVersion: this.config.serviceVersion,
            active: true
        });
    }

    disable() {
        apm = initApm({
            serviceName: this.config.serviceName,
            serverUrl: this.config.serverUrl,
            serviceVersion: this.config.serviceVersion,
            active: false
        });
    }

    setUserContext(userContext) {
        apm.setUserContext({
            id: userContext.userId,
            username: userContext.userEmail,
            email: userContext.userEmail,
        })
    }

    setInitialPageLoadName(pageName) {
        return apm.setInitialPageLoadName(pageName);
    }

    captureError(error) {
        return apm.captureError(new Error(error));
    }

    startTransaction(name, type) {
        return apm.startTransaction(name, type);
    }

    startSpan(name, type) {
        return apm.startSpan(name, type);
    }

    setCustomContext(context) {
        apm.setCustomContext(context);
    }
}