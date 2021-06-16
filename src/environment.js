
const environmentDev = {
    production: true,
    endpoint: 'https://global.api.clockify.me',
    home: 'https://clockify.me',
    signUp: 'https://clockify.me/signup',
    resetPassword: 'https://clockify.me/reset-password',
    startButton:'START',
    stopButton:'STOP',
    terms: 'https://clockify.me/terms',
    webSocket: {
        endpoint: 'wss://stomp.clockify.me',
        clientId: 'clockify'
    }
};

export function getEnv() {
    return environmentDev;
}