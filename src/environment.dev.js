const environmentDev = {
    production: true,
    endpoint: 'https://global.api.clockify.me',
    home: 'https://clockify.me',
    signUp: 'https://clockify.me/signup',
    resetPassword: 'https://clockify.me/reset-password',
    startButton:'START',
    stopButton:'STOP',
    terms: 'https://clockify.me/terms',
    webClientId: 'yout-clientIt-from-google-api-console',
    redirectUriOauthChromeExtension: "login/extension/chrome/oauth2",
    redirectUriOauthFirefoxExtension: "login/extension/firefox/oauth2"
};

export function getEnv() {
    return environmentDev;
}