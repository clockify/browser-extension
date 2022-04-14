
const environmentDev = {
    production: true,
    endpoint: 'https://global.api.clockify.me',
    home: 'https://app.clockify.me',
    signUp: 'https://app.clockify.me/signup',
    resetPassword: 'https://app.clockify.me/reset-password',
    startButton:'START',
    stopButton:'STOP',
    terms: 'https://app.clockify.me/terms',
    webSocket: {
        endpoint: 'wss://stomp.clockify.me',
        clientId: 'clockify'
    }
};

export function getEnv() {
    return environmentDev;
}