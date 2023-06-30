import { getBrowser } from '../helpers/browser-helper';

export async function isOffline() {
	// if (localStorage.getItem('offlineForTest')) {
	//     return JSON.parse(localStorage.getItem('offlineForTest'))
	// }

	if ((await localStorage.getItem('offline')) === 'true') return true;
	else return false;
}

export async function checkConnection() {
	if (navigator && !navigator.onLine) {
		getBrowser().runtime.sendMessage(
			{
				eventName: 'checkInternetConnection',
			},
			function (response) {
				let offline = 'true';

				if (response && response.data && response.data.status === 'UP') {
					offline = 'false';
				}

				localStorage.setItem('offline', offline);
			}
		);
	} else {
		localStorage.setItem('offline', 'false');
	}
}
