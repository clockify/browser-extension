const environmentDev = {
	production: true,
	endpoint: 'https://global.api.clockify.me',
	home: 'https://app.clockify.me',
	signUp: 'https://app.clockify.me/signup',
	resetPassword: 'https://app.clockify.me/reset-password',
	startButton: 'START',
	stopButton: 'STOP',
	clockifyTerms: 'https://clockify.me/terms',
	cakeTerms: 'https://cake.com/terms',
	webSocket: {
		endpoint: 'wss://stomp.clockify.me',
		clientId: 'clockify',
	},
};

export function getEnv() {
	return environmentDev;
}
