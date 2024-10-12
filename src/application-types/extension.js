import React from 'react';
import { getBrowser } from '~/helpers/browser-helper';
import { getIconStatus } from '~/enums/browser-icon-status-enum';
import Login from '../components/login.component';
import HomePage from '../components/home-page.component';
import { getLocalStorageEnums } from '~/enums/local-storage.enum';
import locales from '../helpers/locales';
import { logout } from '~/helpers/utils';
import { useAppStore } from '~/zustand/store';
import {
	addDarkModeClassOnBodyElement,
	removeDarkModeClassFromBodyElement,
} from '~/zustand/slices/darkThemeSlice';

let messageListener = null;
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

	beforeLoad() {
		useAppStore.getState().isCurrentUserDarkTheme()
			? addDarkModeClassOnBodyElement()
			: removeDarkModeClassFromBodyElement();
		window.reactRoot.render(<div className={'loading-gif-before-load'}></div>);
	}
	async afterLoad() {
		const token = await localStorage.getItem('token');
		const isOffline = await localStorage.getItem('offline');
		this.removeListeners();
		this.addListeners();
		// if (mountHtmlElem) {
		//     mountHtmlElem.style.width = '360px';
		//     mountHtmlElem.style.minHeight = '430px';
		// }

		await locales.onProfileLangChange(null);
		if (token) {
			if (!JSON.parse(isOffline)) {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'getUser',
					})
					.then(async (response) => {
						if (response.data) {
							let data = response.data;
							useAppStore.getState().setUserData(data);
							useAppStore.getState().isCurrentUserDarkTheme()
								? addDarkModeClassOnBodyElement()
								: removeDarkModeClassFromBodyElement();
							localStorage.setItem('userEmail', data.email);
							localStorage.setItem('userId', data.id);
							localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
							localStorage.setItem(
								'userSettings',
								JSON.stringify(data.settings)
							);
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
									useAppStore.getState().setBootData(data);
									const { synchronization, frontendUrl } = data;
									if (synchronization && synchronization.websockets) {
										const { websockets } = synchronization;
										let endPoint;
										if (websockets.apps && websockets.apps.extension) {
											endPoint = websockets.apps.extension.endpoint;
										} else {
											endPoint = websockets.endpoint;
										}
										if (endPoint.startsWith('/')) {
											endPoint = `wss://${frontendUrl}${websockets.apps.extension.endpoint}`;
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
						} else if (response.includes('account has been disabled')) {
							logout('USER_BANNED');
						}
					})
					.catch(async (error) => {
						if (window.mountHtmlElement) {
							const isOffline = await localStorage.getItem('offline');
							if (isOffline === 'true') {
								// window.reactRoot.render(<HomePage/>, mountHtmlElem);
							} else {
								logout();
							}
						}
					});
			} else {
				if (window.mountHtmlElement) {
					window.reactRoot.render(<HomePage />);
				}
			}
		} else {
			await localStorage.removeItem('token');
			this.setIcon(getIconStatus().timeEntryEnded);
			if (window.mountHtmlElement) {
				window.reactRoot.render(<Login />);
			}
		}

		// if (!isOffline())
		//     this.registerButtonHandlers();
	}

	addListeners() {
		messageListener = async (request, sender, sendResponse) => {
			switch (request.eventName) {
				case 'WORKSPACE_BANNED':
					localStorage
						.getItem('userWorkspaces')
						.then(async (workspaces) => {
							let bannedWorkspace = workspaces.find(
								(workspace) => workspace.id === request.options.workspaceId
							)?.name;
							logout(request.eventName, {
								...request.options,
								name: bannedWorkspace,
							});
						})
						.catch(() => {
							logout(request.eventName, request.options);
						});
					break;
				case 'USER_BANNED':
				case 'TOKEN_INVALID':
					logout(request.eventName, request.options);
					break;
				case 'WORKSPACE_LOCKED':
					useAppStore.getState().setWorkspaceLocked(true);
					useAppStore
						.getState()
						.setWorkspaceLockedMessage(request?.options?.message);
					break;
				case 'VERIFY_EMAIL_ENFORCED':
					useAppStore.getState().setEmailEnforcedModalVisible(true);
					break;
				case 'USER_EMAIL_VERIFIED':
					getBrowser()
						.runtime.sendMessage({
							eventName: 'getUser',
						})
						.then(async (response) => {
							if (response.data) {
								let data = response.data;
								useAppStore.getState().setUserData(data);
							}
						});
					break;
			}
		};

		getBrowser().runtime.onMessage.addListener(messageListener);
	}

	removeListeners() {
		messageListener &&
			getBrowser().runtime.onMessage.removeListener(messageListener);
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