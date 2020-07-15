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
    },
    webClientId: '800081634217-rbfe00vph9bbuk3cldi3hfemufs7r2bd.apps.googleusercontent.com',
    desktopClientId: '800081634217-38lf9eop18c3bltrol2deg89qqkm9m07.apps.googleusercontent.com',
    redirectUriOauthChromeExtension: "login/extension/chrome/oauth2",
    redirectUriOauthFirefoxExtension: "login/extension/firefox/oauth2",
    redirectUriOauthDesktop: "urn:ietf:wg:oauth:2.0:oob:auto",
    redirectUriSaml2Desktop: "https:localhost"
};

export function getEnv() {
    return environmentDev;
}