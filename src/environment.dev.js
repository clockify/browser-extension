const environmentDev = {
    production: true,
    endpoint: 'https://api.clockify.me/api',
    home: 'https://clockify.me',
    signUp: 'https://clockify.me/signup',
    resetPassword: 'https://clockify.me/reset-password',
    startButton:'START',
    stopButton:'STOP',
    webSocket: {
        endpoint: 'wss://stomp.clockify.me',
        clientId: 'clockify'
    },
    redirectUriOauthChromeExtension: "login/extension/chrome/oauth2",
    redirectUriOauthFirefoxExtension: "login/extension/firefox/oauth2",
    webClientId: 'your-clientId-from-google-api-console'
};

export function getEnv() {
    return environmentDev;
}