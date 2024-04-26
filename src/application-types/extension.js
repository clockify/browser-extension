import React from 'react';
import { getBrowser } from '../helpers/browser-helper';
import { getIconStatus } from '../enums/browser-icon-status-enum';
import Login from '../components/login.component';
import HomePage from '../components/home-page.component';
import { getLocalStorageEnums } from '../enums/local-storage.enum';
import locales from '../helpers/locales';
import { HtmlStyleHelper } from '../helpers/html-style-helper';
import { logout } from '../helpers/utils';
import useWorkspaceStore from '../zustand/stores/workspaceStore';
import useUserStore from '../zustand/stores/userStore';
import useBootStore from '../zustand/stores/bootStore';
import useUIStore from '../zustand/stores/UIStore';

const htmlStyleHelper = new HtmlStyleHelper();
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
			await htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();
			if (!JSON.parse(isOffline)) {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'getUser',
					})
					.then(async (response) => {
						if (response.data) {
							let data = response.data;
							useUserStore.getState().setUserData(data);

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
									useBootStore.getState().setBootData(data);
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
											endPoint = `wss://${data.frontendUrl}${websockets.apps.extension.endpoint}`;
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
					useWorkspaceStore.getState().setWorkspaceLocked(true);
					useWorkspaceStore
						.getState()
						.setWorkspaceLockedMessage(request?.options?.message);
					break;
				case 'VERIFY_EMAIL_ENFORCED':
					useUIStore.getState().setEmailEnforcedModalVisible(true);
					break;
				case 'USER_EMAIL_VERIFIED':
					getBrowser()
						.runtime.sendMessage({
							eventName: 'getUser',
						})
						.then(async (response) => {
							if (response.data) {
								let data = response.data;
								useUserStore.getState().setUserData(data);
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