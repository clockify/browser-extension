import React from 'react';
import { getBrowser } from '../helpers/browser-helper';
import { getIconStatus } from '../enums/browser-icon-status-enum';
import Login from '../components/login.component';
import HomePage from '../components/home-page.component';
import { getLocalStorageEnums } from '../enums/local-storage.enum';
import locales from '../helpers/locales';
import { HtmlStyleHelper } from '../helpers/html-style-helper';

const htmlStyleHelper = new HtmlStyleHelper();

export class Extension {
	setIcon(iconStatus) {
		const iconPathStarted = '../assets/images/logo-16.png';
		const iconPathEnded = '../assets/images/logo-16-gray.png';

		getBrowser().action.setIcon({
			path:
				getIconStatus().timeEntryStarted === iconStatus
					? iconPathStarted
					: iconPathEnded,
		});
	}

	async afterLoad() {
		const token = await localStorage.getItem('token');
		const isOffline = await localStorage.getItem('offline');
		// if (mountHtmlElem) {
		//     mountHtmlElem.style.width = '360px';
		//     mountHtmlElem.style.minHeight = '430px';
		// }

		await locales.onProfileLangChange(null);
		if (token) {
			await htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();
			if (!JSON.parse(isOffline)) {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'getUser',
					})
					.then(async (response) => {
						let data = response.data;
						localStorage.setItem('userEmail', data.email);
						localStorage.setItem('userId', data.id);
						localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
						localStorage.setItem('userSettings', JSON.stringify(data.settings));
						const lang = data.settings.lang
							? data.settings.lang.toLowerCase()
							: null;
						await locales.onProfileLangChange(lang);
						window.reactRoot.render(<HomePage />);
						// getBrowser().runtime.sendMessage({
						//     eventName: "pomodoroTimer"
						// });
						getBrowser()
							.runtime.sendMessage({
								eventName: 'getBoot',
							})
							.then((response) => {
								const { data } = response;
								const { selfHosted } = data;
								if (data.synchronization && data.synchronization.websockets) {
									const { websockets } = data.synchronization;
									let endPoint;
									if (websockets.apps && websockets.apps.extension) {
										endPoint = websockets.apps.extension.endpoint;
									} else {
										endPoint = websockets.endpoint;
									}
									if (endPoint.startsWith('/')) {
										endPoint = `${data.frontendUrl.replace(
											/\/$/,
											''
										)}${endPoint}`;
									}
									localStorage.setItem(
										'webSocketEndpoint',
										endPoint,
										getLocalStorageEnums().PERMANENT_PREFIX
									);
								}
								// if (mountHtmlElem) {
								// window.reactRoot.render(<HomePage/>, mountHtmlElem);
								// }
							})
							.catch((err) => {
								// if (mountHtmlElem) {
								// window.reactRoot.render(<HomePage/>, mountHtmlElem);
								// }
							});
					})
					.catch(async (error) => {
						if (window.mountHtmlElement) {
							const isOffline = await localStorage.getItem('offline');
							if (isOffline === 'true') {
								// window.reactRoot.render(<HomePage/>, mountHtmlElem);
							} else {
								window.reactRoot.render(<Login logout={true} />);
							}
						}
					});
			} else {
				if (window.mountHtmlElement) {
					window.reactRoot.render(<HomePage />);
				}
			}
		} else {
			this.setIcon(getIconStatus().timeEntryEnded);
			if (window.mountHtmlElement) {
				window.reactRoot.render(<Login />);
			}
		}

		// if (!isOffline())
		//     this.registerButtonHandlers();
	}

	saveOneToLocalStorage(key, value) {
		localStorage.setItem(key, value);
	}

	saveOneToBrowserStorage(map) {
		getBrowser().storage.local.set(map);
	}

	saveOneToStorages(key, value) {
		this.saveOneToLocalStorage(key, value);
		this.saveOneToBrowserStorage({ key: value });
	}

	saveAllToLocalStorage(map) {
		for (const key in map) {
			this.saveOneToLocalStorage(key, map[key]);
		}
	}

	saveAllToBrowserStorage(map) {
		getBrowser().storage.local.set(map);
	}

	saveAllToStorages(map) {
		this.saveAllToLocalStorage(map);
		this.saveAllToBrowserStorage(map);
	}
}
