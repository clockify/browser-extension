import React, { Component } from 'react';
import Header from './header.component.jsx';
import StartTimer from './start-timer.component';
import moment, { duration } from 'moment';
import TimeEntryList from './time-entry-list.component';
import TimeEntryListNotSynced from './time-entry-list-notsynced.component';
import 'moment-duration-format';
import EditForm from './edit-form.component';
import { RequiredFields } from '~/components/RequiredFields.tsx';
import { isOffline } from './check-connection';
import packageJson from '../../package';
import { getIconStatus } from '~/enums/browser-icon-status-enum';
import { Application } from '~/application';
import { getBrowser } from '~/helpers/browser-helper';
import { getWebSocketEventsEnums } from '~/enums/web-socket-events.enum';
import { CountdownTimer } from '~/components/CountdownTimer.tsx';
import { ModalsContainer } from './NotificationModals/ModalContainer.tsx';
import { mapStateToProps } from '~/zustand/mapStateToProps';
import { getWorkspacePermissionsEnums } from '~/enums/workspace-permissions.enum';
import { getLocalStorageEnums } from '~/enums/local-storage.enum';
import { HtmlStyleHelper } from '~/helpers/html-style-helper';
import Toaster from './toaster-component';
import { getManualTrackingModeEnums } from '~/enums/manual-tracking-mode.enum';
import { debounce } from 'lodash';
import { Logger } from '~/components/Logger.tsx';
import { offlineStorage } from '~/helpers/offlineStorage';
import locales from '../helpers/locales';
import { numberFormatTransform } from '~/helpers/duration-formater';
import { parseTime } from './time-input-parser';
import { BannerContainer } from '~/components/NotificationBanners/BannerContainer.tsx';

const messages = [
	'TIME_ENTRY_STARTED',
	'TIME_ENTRY_STOPPED',
	'TIME_ENTRY_DELETED',
	'TIME_ENTRY_UPDATED',
	'TIME_ENTRY_CREATED',
	'WORKSPACE_SETTINGS_UPDATED',
	'CHANGED_ADMIN_PERMISSION',
	'ACTIVE_WORKSPACE_CHANGED',
];
const htmlStyleHelper = new HtmlStyleHelper();
let websocketHandlerListener = null;

let _webSocketConnectExtensionDone = false;

// let _checkOfflineMS = 5000;
// let _timeoutCheckOffline = null;

let _receiveOfflineEventsName;

let _logLines = [];
let _loggerInterval = null;
const _withLogger = false;

let _networkHandlerListener;
const networkMessages = ['STATUS_CHANGED_ONLINE', 'STATUS_CHANGED_OFFLINE'];

class HomePage extends Component {
	constructor(props) {
		super(props);

		this.state = {
			ready: false,
			selectedTimeEntry: {},
			timeEntries: [],
			dates: {},
			loadMore: true,
			pageCount: 0,
			inProgress: null,
			loading: false,
			workspaceSettings: {
				timeTrackingMode: getManualTrackingModeEnums().DEFAULT,
				projectPickerSpecialFilter: false,
				forceProjects: false,
			},
			features: null,
			mode: 'timer',
			manualModeDisabled: false,
			pullToRefresh: false,
			projects: [],
			tasks: [],
			userSettings: {},
			durationMap: {},
			weekStatusMap: {},
			periodStatusMap: {},
			isUserOwnerOrAdmin: null,
			isOffline: null,
			lang: 'en',
			groups: [],
			pomodoroTimeInterval: 5,
			pomodoroShortBreak: 5,
			pomodoroLongBreak: 15,
			wasRegionalEverAllowed: null,
			time: moment().hour(0).minute(0).second(0).format('HH:mm:ss'),
		};

		this.application = new Application();

		this.initialJob = this.initialJob.bind(this);
		this.handleScroll = this.handleScroll.bind(this);
		this.loadMoreEntries = this.loadMoreEntries.bind(this);
		this.getEntryFromPomodoroAndIdleEvents = this.getEntryFromPomodoroAndIdleEvents.bind(this);
		this.saveAllOfflineEntries = this.saveAllOfflineEntries.bind(this);

		this.connectionHandler = this.connectionHandler.bind(this);
		this.handleRefresh = this.handleRefresh.bind(this);
		// this.checkOffline = this.checkOffline.bind(this);
		// this.checkReload = this.checkReload.bind(this);
		this.reloadOnlineByEvent = debounce(this.reloadOnlineByEvent, 5000);
		this.reloadOnlineByChecking = debounce(this.reloadOnlineByChecking, 3000);
		this.reloadOffline = debounce(this.reloadOffline, 1000);

		this.loggerRef = React.createRef();
		this.displayLog = this.displayLog.bind(this);
		this.workspaceChanged = this.workspaceChanged.bind(this);
		this.changeMode = this.changeMode.bind(this);
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.onStorageChange = this.onStorageChange.bind(this);
		this.clearEntries = this.clearEntries.bind(this);
		this.triggerOfflineEntrySync = this.triggerOfflineEntrySync.bind(this);
		this.backgroundMessageListener = this.backgroundMessageListener.bind(this);
		this.preventDragHandler = this.preventDragHandler.bind(this);

		offlineStorage.load();
	}

	async setAsyncStateItems() {
		let mode = await localStorage.getItem('mode');
		const isOff = await isOffline();
		const lang = await localStorage.getItem('lang');
		const preData = await localStorage.getItem('preData');
		moment.locale(lang);

		mode = mode ? mode : 'timer';
		const userSettings = JSON.parse(await localStorage.getItem('userSettings')) || {};
		this.setState({
			mode,
			userSettings,
			isOffline: isOff,
		});

		if (preData) {
			let timeEntries = preData?.groupEntries;
			if (!preData.groupEntries && preData.bgEntries && preData.weekStatusMap) {
				timeEntries = await this.groupEntries(
					preData.bgEntries,
					preData.durationMap,
					preData.weekStatusMap,
					preData.periodStatusMap,
					preData.approvalPeriod
				);
			}
			this.setState(state => ({
				timeEntries: timeEntries || state.timeEntries,
				dates: preData?.dates || state.dates,
				durationMap: preData?.durationMap || state.durationMap,
				weekStatusMap: preData?.weekStatusMap || state.weekStatusMap,
				periodStatusMap: preData?.periodStatusMap || state.periodStatusMap,
				groups: preData?.groups || state.groups,
			}));
		}

		localStorage.setItem('appVersion', packageJson.version);
		document.addEventListener('scroll', this.handleScroll, false);

		_receiveOfflineEventsName = 'receivingOfflineEvents';

		this.getWorkspaceSettings();

		this.initialJob();

		if (_withLogger)
			_loggerInterval = setInterval(() => {
				this.displayLog();
			}, 3000);
	}

	log(msg) {
		if (_withLogger) _logLines.push(msg);
	}

	displayLog() {
		const len = _logLines.length;
		if (this.loggerRef && this.loggerRef.current) {
			for (var i = 0; i < len; i++) {
				const msg = _logLines.shift();
				this.loggerRef.current.log(msg);
			}
		}
	}

	async onStorageChange(changes) {
		if (changes.workspaceSettings?.newValue) {
			this.workspaceSettings = true;
		}

		if (this.workspaceSettings) {
			this.workspaceSettings = false;
			this.forceUpdate();
			this.setAsyncStateItems();
			getBrowser().storage.onChanged.removeListener(this.onStorageChange);
		}
	}

	backgroundMessageListener(request, sender, sendResponse) {
		if (request.eventName === 'offlineEntryAdded') {
			offlineStorage.load();
			this.forceUpdate();
		}
	}

	async componentDidMount() {
		this.handleRefresh();
		const workspaceSettings = await localStorage.getItem('workspaceSettings');
		if (!workspaceSettings) {
			getBrowser().storage.onChanged.addListener(this.onStorageChange);
			this.getWorkspaceSettings();
			return;
		}
		getBrowser().runtime.onMessage.addListener(this.backgroundMessageListener);

		window.ononline = event => {
			this.connectionHandler({ type: 'online' });
		};

		window.onoffline = event => {
			this.connectionHandler({ type: 'offline' });
		};
		this.setAsyncStateItems();
	}

	componentDidUpdate(prevProps) {
		localStorage
			.getItem('activeWorkspaceId')
			.then(activeWorkspaceId => {
				if (activeWorkspaceId !== this.state.activeWorkspaceId) {
					this.setState({ activeWorkspaceId });
				}
			})
			.catch(error => console.log(error));

		this.getPomodoroForUser().then(pomodoroForUser => {
			if (!pomodoroForUser) return;
			if (pomodoroForUser.enabled !== this.state.pomodoroEnabled) {
				this.setState({ pomodoroEnabled: pomodoroForUser.enabled });
			}
			if (pomodoroForUser.isFocusModeEnabled !== this.state.isFocusModeEnabled) {
				this.setState({
					isFocusModeEnabled: pomodoroForUser.isFocusModeEnabled,
				});
			}
			if (
				pomodoroForUser.timerInterval &&
				pomodoroForUser.timerInterval !== this.state.pomodoroTimeInterval
			) {
				this.setState({ pomodoroTimeInterval: pomodoroForUser.timerInterval });
			}
			if (
				pomodoroForUser.shortBreak &&
				pomodoroForUser.shortBreak !== this.state.pomodoroShortBreak
			) {
				this.setState({ pomodoroShortBreak: pomodoroForUser.shortBreak });
			}
			if (
				pomodoroForUser.longBreak &&
				pomodoroForUser.longBreak !== this.state.pomodoroLongBreak
			) {
				this.setState({ pomodoroLongBreak: pomodoroForUser.longBreak });
			}
		});
	}

	async initialJob() {
		// const receiveOfflineEventsName = await localStorage.getItem(_receiveOfflineEventsName, 'false');
		const isOnline = !(await isOffline());
		// if ( receiveOfflineEventsName !== 'true') {
		//     this.log('=> polling offline mode')
		//     if (_timeoutCheckOffline)
		//         clearTimeout(_timeoutCheckOffline);
		//     _timeoutCheckOffline = setTimeout(() => this.checkOffline(), 3000);
		// }

		if (!websocketHandlerListener) this.webSocketMessagesHandler();

		if (!_networkHandlerListener) this.networkMessagesHandler();

		if (!_webSocketConnectExtensionDone) {
			this.enableAllIntegrationsButtonIfNoneIsEnabled();
			this.enableTimerShortcutForFirstTime();
			if (isOnline) {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'webSocketConnect',
					})
					.catch(error => {
						console.log('home-page.component.js | line 306 | error:', error);
					});
				_webSocketConnectExtensionDone = true;
			}
			this.getEntryFromPomodoroAndIdleEvents();
		}

		if (isOnline) {
			this.setIsUserOwnerOrAdmin();
		}
		// else {

		this.handleRefresh();
		// }
	}

	workspaceChanged() {
		const { sendMessage } = getBrowser().runtime;

		this.getWorkspaceSettings()
			.then(response => {
				this.handleRefresh();
				if (this.header) this.header.checkScreenshotNotifications();
				sendMessage({ eventName: 'restartPomodoro' });
			})
			.catch(error => {});

		sendMessage({ eventName: 'workspaceChanged' });
	}

	componentWillUnmount() {
		this.log('componentWillUnmount');
		// if (_timeoutCheckOffline) {
		//     clearTimeout(_timeoutCheckOffline);
		//     _timeoutCheckOffline = null;
		// }

		getBrowser().runtime.onMessage.removeListener(_networkHandlerListener);
		_networkHandlerListener = null;

		getBrowser().runtime.onMessage.removeListener(websocketHandlerListener);
		websocketHandlerListener = null;

		getBrowser().runtime.onMessage.removeListener(this.backgroundMessageListener);

		document.removeEventListener('scroll', this.handleScroll, false);

		this.log('componentWillUnmount done');
		if (_loggerInterval) clearInterval(_loggerInterval);

		getBrowser().storage.onChanged.removeListener(this.onStorageChange);
	}

	reloadOnlineByEvent() {
		this.getWorkspaceSettings()
			.then(response => {
				this.initialJob();
			})
			.catch(error => {});
	}

	reloadOnlineByChecking() {
		this.getWorkspaceSettings()
			.then(response => {
				this.initialJob();
			})
			.catch(error => {});
	}

	reloadOffline() {
		this.handleRefresh();
	}

	connectionHandler(event) {
		// if (_timeoutCheckOffline) {
		//     clearTimeout(_timeoutCheckOffline);
		//     _timeoutCheckOffline = null;
		// }
		this.log(`handler event --------------> '${event.type}'`);
		localStorage.setItem(
			_receiveOfflineEventsName,
			'true',
			getLocalStorageEnums().PERMANENT_PREFIX
		);
		let isOff;
		if (event.type === 'online') {
			localStorage.setItem('offline', 'false');
			isOff = false;
			this.setState({ isOffline: false });
		} else {
			localStorage.setItem('offline', 'true');
			isOff = true;
			this.setState({ isOffline: true });
		}

		if (isOff) this.reloadOffline();
		else this.reloadOnlineByEvent();
	}

	getEntryFromPomodoroAndIdleEvents() {
		getBrowser().runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.eventName === 'pomodoroEvent' || request.eventName === 'idleEvent') {
				if (request.timeEntry !== null) {
					if (this.start) this.start.getTimeEntryInProgress();
				} else {
					if (request.eventName === 'idleEvent') {
						if (this.start) this.start.setTimeEntryInProgress(null);
					}
					this.getTimeEntries();
				}
			}
		});
	}

	async setIsUserOwnerOrAdmin() {
		if (!(await isOffline())) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getPermissionsForUser',
				})
				.then(response => {
					if (!response?.data?.userRoles) return;
					const isUserOwnerOrAdmin =
						response.data.userRoles.filter(
							permission =>
								permission.role === getWorkspacePermissionsEnums().WORKSPACE_OWN ||
								permission.role === getWorkspacePermissionsEnums().WORKSPACE_ADMIN
						).length > 0;
					this.setState(
						{
							isUserOwnerOrAdmin,
						},
						() => {
							localStorage.setItem('isUserOwnerOrAdmin', isUserOwnerOrAdmin);
							// this.handleRefresh(true);
						}
					);
				});
		}
	}

	enableTimerShortcutForFirstTime() {
		const { usersTimerShortcutPreferences, userData, toggleTimerShortcut } = this.props;
		const hasUserTimerShortcut = usersTimerShortcutPreferences.some(
			timerShortcut => timerShortcut && timerShortcut.userId === userData.id
		);

		if (!hasUserTimerShortcut) {
			toggleTimerShortcut();
		}
	}

	webSocketMessagesHandler() {
		websocketHandlerListener = (request, sender, sendResponse) => {
			if (messages.includes(request.eventName)) {
				this.setState(
					{
						mode: 'timer',
						pageCount: 0,
					},
					() => {
						switch (request.eventName) {
							case getWebSocketEventsEnums().TIME_ENTRY_STARTED:
								this.log('TIME_ENTRY_STARTED');
								getBrowser()
									.runtime.sendMessage({
										eventName: 'getEntryInProgress',
									})
									.then(response => {
										if (this.start)
											this.start.setTimeEntryInProgress(response.data);
									})
									.catch(error => {
										console.log(
											'home-page.component.js | line 500 | error:',
											error
										);
									});
								break;
							case getWebSocketEventsEnums().TIME_ENTRY_CREATED:
								this.getTimeEntries();
								break;
							case getWebSocketEventsEnums().TIME_ENTRY_STOPPED:
								this.start.setTimeEntryInProgress(null);
								this.getTimeEntries();
								break;
							case getWebSocketEventsEnums().TIME_ENTRY_UPDATED:
								getBrowser()
									.runtime.sendMessage({
										eventName: 'getEntryInProgress',
									})
									.then(response => {
										this.start.setTimeEntryInProgress(response.data);
									})
									.catch(error => {
										console.log(
											'home-page.component.js | line 522 | error:',
											error
										);
									});
								this.getTimeEntries();
								break;
							case getWebSocketEventsEnums().TIME_ENTRY_DELETED:
								getBrowser()
									.runtime.sendMessage({
										eventName: 'getEntryInProgress',
									})
									.then(response => {
										this.start.setTimeEntryInProgress(response.data);
									})
									.catch(error => {
										console.log(
											'home-page.component.js | line 538 | error:',
											error
										);
									});
								this.getTimeEntries();
								break;
							case getWebSocketEventsEnums().WORKSPACE_SETTINGS_UPDATED:
								this.workspaceChanged();
								break;
							case getWebSocketEventsEnums().ACTIVE_WORKSPACE_CHANGED:
								this.workspaceChanged();
								break;
							case getWebSocketEventsEnums().CHANGED_ADMIN_PERMISSION:
								this.setIsUserOwnerOrAdmin();
								break;
						}
					}
				);
			}
		};

		getBrowser().runtime.onMessage.addListener(websocketHandlerListener);
	}

	networkMessagesHandler() {
		_networkHandlerListener = (request, sender, sendResponse) => {
			if (networkMessages.includes(request.eventName)) {
				switch (request.eventName) {
					case 'STATUS_CHANGED_ONLINE':
						this.log('STATUS_CHANGED_ONLINE');
						this.connectionHandler({ type: 'online' });
						break;
					case 'STATUS_CHANGED_OFFLINE':
						this.log('STATUS_CHANGED_OFFLINE');
						this.connectionHandler({ type: 'offline' });
						break;
				}
			}
		};

		getBrowser().runtime.onMessage.addListener(_networkHandlerListener);
	}

	async saveAllOfflineEntries() {
		if (!(await isOffline())) {
			let timeEntries = offlineStorage.timeEntriesOffline;
			timeEntries.map(entry => {
				const cfs =
					entry.customFieldValues && entry.customFieldValues.length > 0
						? entry.customFieldValues
								.filter(cf => cf.customFieldDto.status === 'VISIBLE')
								.map(({ type, customFieldId, value }) => ({
									customFieldId,
									sourceType: 'TIMEENTRY',
									value: type === 'NUMBER' ? parseFloat(value) : value,
								}))
						: [];
				getBrowser()
					.runtime.sendMessage({
						eventName: 'startWithDescription',
						options: {
							projectId: entry.projectId,
							description: entry.description,
							billable: entry.billable,
							start: entry.timeInterval.start,
							end: entry.timeInterval.end,
							taskId: entry.taskId,
							tagIds: entry.tagIds,
							customFields: cfs,
						},
					})
					.then(response => {
						if (response && response.data) {
							let timeEntries = offlineStorage.timeEntriesOffline;
							if (
								timeEntries.findIndex(
									entryOffline => entryOffline.id === entry.id
								) > -1
							) {
								timeEntries.splice(
									timeEntries.findIndex(
										entryOffline => entryOffline.id === entry.id
									),
									1
								);
							}
							offlineStorage.timeEntriesOffline = timeEntries;
						} else {
							this.toaster.toast(
								'error',
								`Missing fields in entry: ${entry.description}`,
								4
							);
						}
					})
					.catch(error => {
						if (error.request.status === 403) {
							const response = JSON.parse(error.request.response);
							if (response.code === 4030) {
								// setTimeout(() => this.showMessage.bind(this)(response.message, 10), 1000)
							}
						}
					});
			});
			offlineStorage.timeEntryInOffline = null;
		}
	}

	async getWorkspaceSettings() {
		if (!(await isOffline())) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getUserRoles',
				})
				.then(response => {
					if (response && response.data && response.data.userRoles) {
						const { userRoles } = response.data;
						getBrowser().storage.local.set({
							userRoles,
						});
					} else {
					}
				})
				.catch(error => {
					console.log(error);
				});
		}

		return getBrowser()
			.runtime.sendMessage({
				eventName: 'getWorkspaceSettings',
			})
			.then(async response => {
				if (!response.data) {
					throw new Error(response);
				}
				let { workspaceSettings, features, featureSubscriptionType } = response.data;
				const userHasCustomFieldsFeature = workspaceSettings?.features?.customFields;
				if (!userHasCustomFieldsFeature) offlineStorage.wsCustomFields = [];
				workspaceSettings.projectPickerSpecialFilter =
					this.state.userSettings.projectPickerTaskFilter;
				if (!workspaceSettings.hasOwnProperty('timeTrackingMode')) {
					workspaceSettings.timeTrackingMode = getManualTrackingModeEnums().DEFAULT;
				}
				const manualModeDisabled =
					workspaceSettings.timeTrackingMode ===
					getManualTrackingModeEnums().STOPWATCH_ONLY;
				let wasRegionalEverAllowed = null;
				const selfHosted = featureSubscriptionType === 'SELF_HOSTED';
				if (!selfHosted) {
					wasRegionalEverAllowed = await getBrowser().runtime.sendMessage({
						eventName: 'getWasRegionalEverAllowed',
					});
				}
				this.setState(
					{
						workspaceSettings,
						features,
						manualModeDisabled,
						mode: manualModeDisabled ? 'timer' : this.state.mode,
						wasRegionalEverAllowed,
						selfHosted,
					},
					() => {
						localStorage.setItem('mode', this.state.mode); // for usage in edit-forms
						localStorage.setItem(
							'manualModeDisabled',
							JSON.stringify(this.state.manualModeDisabled)
						); // for usage in header
						workspaceSettings = Object.assign({}, workspaceSettings, {
							features: {
								featureSubscriptionType,
								customFields: features?.includes('CUSTOM_FIELDS'),
								timeTracking: features?.includes('TIME_TRACKING'),
							},
						});
						localStorage.setItem(
							'workspaceSettings',
							JSON.stringify(workspaceSettings)
						);
						offlineStorage.userHasCustomFieldsFeature =
							workspaceSettings.features.customFields;
						offlineStorage.activeBillableHours = workspaceSettings.activeBillableHours;
						offlineStorage.onlyAdminsCanChangeBillableStatus =
							workspaceSettings.onlyAdminsCanChangeBillableStatus;
						return Promise.resolve(true);
					}
				);
			})
			.catch(error => {
				this.log('getWorkspaceSettings() failure');
				console.log(error);
				return Promise.reject(true);
			});
	}

	async getTimeEntries(reload) {
		const isOff = await isOffline();
		if (!isOff) {
			// shouldn't use this.state.isOffline here

			getBrowser()
				.runtime.sendMessage({
					eventName: 'getTimeEntries',
					options: {
						page: reload ? 0 : this.state.pageCount,
					},
				})
				.then(async response => {
					const timeEntries = response.data.timeEntriesList.filter(
						entry => entry.timeInterval.end
					);
					const { durationMap, weekStatusMap, periodStatusMap, approvalPeriod } =
						response.data;
					const groupEntries = await this.groupEntries(
						timeEntries,
						durationMap,
						weekStatusMap,
						periodStatusMap,
						approvalPeriod
					);
					this.setState(
						{
							timeEntries: groupEntries,
							durationMap,
							weekStatusMap,
							periodStatusMap,
							ready: true,
							isOffline: false, // should set isOffline here
						},
						() => {
							localStorage.setItem('preData', {
								groupEntries: groupEntries,
								durationMap,
								dates: this.state.dates,
								weekStatusMap,
								groups: this.state.groups,
								periodStatusMap,
								approvalPeriod,
							});
						}
					);
				})
				.catch(error => {
					this.setState({
						isOffline: isOff,
					});
				});
		} else {
			this.setState({
				timeEntries:
					offlineStorage.timeEntriesOffline.length > 0
						? await this.groupEntries(offlineStorage.timeEntriesOffline)
						: [],
				ready: true,
				isOffline: true,
			});
		}
		if (reload || this.state.pageCount === 0) {
			htmlStyleHelper.scrollToTop();
		}
	}

	async durationFormat() {
		const workspaceSettings = JSON.parse(await localStorage.getItem('workspaceSettings'));
		const { trackTimeDownToSecond, decimalFormat } = workspaceSettings;

		if (decimalFormat) {
			return 'h.hh'; /* decimal */
		} else if (trackTimeDownToSecond) {
			return 'HH:mm:ss'; /* full */
		} else {
			return 'H:mm'; /* compact */
		}
	}

	async groupEntries(
		timeEntries,
		durationMap,
		weekStatusMap = {},
		periodStatusMap = {},
		approvalPeriod
	) {
		const wsSettings = JSON.parse(await localStorage.getItem('workspaceSettings'));
		const { timeZone } = JSON.parse(await localStorage.getItem('userSettings')) || {};
		const decimalFormat = wsSettings?.decimalFormat;
		const trackTimeDownToSeconds =
			typeof this.state.workspaceSettings.trackTimeDownToSecond !== 'undefined'
				? this.state.workspaceSettings.trackTimeDownToSecond
				: wsSettings?.trackTimeDownToSecond;
		let dates = [];
		let statusMap = weekStatusMap;
		let isWeekly = approvalPeriod === 'WEEKLY';
		const isMonthly = approvalPeriod === 'MONTHLY';
		const isSemiMonthly = approvalPeriod === 'SEMI_MONTHLY';
		if (isMonthly || isSemiMonthly) {
			statusMap = periodStatusMap;
		} else {
			isWeekly = true;
		}
		const durationFormat = await this.durationFormat();
		let groups = Object.values(statusMap)
			.sort((a, b) => {
				return moment(b.dateRange.start, 'YYYY-MM-DD')
					.tz(timeZone)
					.diff(moment(a.dateRange.start, 'YYYY-MM-DD').tz(timeZone));
			})
			.map(group => {
				/* 				const total = decimalFormat
					? toDecimalFormat(duration(group.total))
					: duration(group.total).format(
						trackTimeDownToSeconds ? 'HH:mm:ss' : 'h:mm',
						{ trim: false }
					  ); */
				const total = numberFormatTransform(
					parseTime(group.total, durationFormat),
					wsSettings.numberFormat,
					durationFormat
				);
				let title = `${moment.utc(group.dateRange.start).format('MMM D')} - ${moment
					.utc(group.dateRange.end)
					.format('MMM D')}`;

				const dateA = moment.utc(group.dateRange.start);
				const dateB = moment.utc(group.dateRange.end);

				const today = moment.utc(moment().tz(timeZone).format('YYYY-MM-DD'));
				if (isMonthly) {
					title = dateB.format('MMMM');
				}
				if (today.year() !== dateB.year()) {
					title += `, ${dateB.format('YYYY')}`;
				}
				if (!isSemiMonthly) {
					if (today.isBetween(dateA, dateB, undefined, '[]')) {
						title = locales.THIS_WEEK;
						if (isMonthly) {
							title = locales.THIS_MONTH;
						}
					} else if (
						today.diff(dateB, 'days', true) <= 7 &&
						today.diff(dateB, 'days', true) >= 0 &&
						isWeekly
					) {
						title = locales.LAST_WEEK;
					} else if (
						isMonthly &&
						today.startOf('month').diff(dateB.endOf('month'), 'days', true) < 1
					) {
						title = locales.LAST_MONTH;
					}
				}

				return {
					dateRange: { ...group.dateRange },
					total,
					title,
					totalTitle: isMonthly
						? locales.MONTHLY_TOTAL + ':'
						: isSemiMonthly
						? locales.SEMI_MONTHLY_TOTAL + ':'
						: locales.WEEK_TOTAL,
					dates: [],
				};
			});

		if (timeEntries.length > 0) {
			await this.groupTimeEntriesByDays(
				timeEntries,
				decimalFormat,
				trackTimeDownToSeconds,
				dates,
				groups,
				timeZone
			);
		}
		const formatedDurationMap = this.formatDurationMap(durationMap, timeZone);

		dates = dates.map(day => {
			let dayDuration = duration(0);
			if (durationMap) {
				dayDuration = formatedDurationMap[day];
			} else {
				timeEntries.forEach(entry => {
					if (entry => entry.start === day) {
						dayDuration = dayDuration + duration(entry.timeInterval.duration);
					}
				});
			}

			const format = numberFormatTransform(
				parseTime(dayDuration, durationFormat),
				wsSettings.numberFormat,
				durationFormat
			);

			return day + '-' + format;
		});

		this.setState({
			dates,
			groups,
		});

		return timeEntries;
	}

	async groupTimeEntriesByDays(
		timeEntries,
		decimalFormat,
		trackTimeDownToSeconds,
		dates,
		groups,
		timeZone
	) {
		const wsSettings = JSON.parse(await localStorage.getItem('workspaceSettings'));
		const durationFormat = await this.durationFormat();

		timeEntries.forEach(timeEntry => {
			if (
				moment(timeEntry.timeInterval.start)
					.tz(timeZone)
					.isSame(moment().tz(timeZone), 'day')
			) {
				timeEntry.start = locales.TODAY_LABEL;
			} else if (
				moment(timeEntry.timeInterval.start)
					.tz(timeZone)
					.isSame(moment().subtract(1, 'day').tz(timeZone), 'day')
			) {
				timeEntry.start = locales.YESTERDAY_LABEL;
			} else {
				timeEntry.start = moment(timeEntry.timeInterval.start)
					.tz(timeZone)
					.format('ddd, Do MMM');
			}

			if (!trackTimeDownToSeconds) {
				const diffInSeconds =
					moment(timeEntry.timeInterval.end)
						.tz(timeZone)
						.diff(timeEntry.timeInterval.start) / 1000;
				if (diffInSeconds % 60 > 0) {
					timeEntry.timeInterval.end = moment(timeEntry.timeInterval.end)
						.tz(timeZone)
						.add(60 - (diffInSeconds % 60), 'seconds');
				}
			}
			const durationDiff = duration(
				moment(timeEntry.timeInterval.end).tz(timeZone).diff(timeEntry.timeInterval.start)
			);
			timeEntry.duration = numberFormatTransform(
				parseTime(durationDiff, durationFormat),
				wsSettings.numberFormat,
				durationFormat
			);
			if (dates.indexOf(timeEntry.start) === -1) {
				dates.push(timeEntry.start);
				const index = groups.findIndex(group => {
					const dateA = moment.utc(group.dateRange.start);
					const dateB = moment.utc(group.dateRange.end);
					const dateC = moment.utc(
						moment(timeEntry.timeInterval.start).tz(timeZone).format('YYYY-MM-DD')
					);
					return dateC.isBetween(dateA, dateB, 'days', '[]');
				});
				if (index !== -1) {
					groups[index].dates.push(timeEntry.start);
				}
			}
		});
	}

	formatDurationMap(durationMap, timeZone) {
		let formatedDurationMap = {};
		let formatedKey;
		for (let key in durationMap) {
			formatedKey = moment(key).tz(timeZone).isSame(moment(), 'day')
				? locales.TODAY_LABEL
				: moment(key).tz(timeZone).isSame(moment().subtract(1, 'day').tz(timeZone), 'day')
				? locales.YESTERDAY_LABEL
				: moment(key).tz(timeZone).format('ddd, Do MMM');
			formatedDurationMap[formatedKey] = durationMap[key];
		}

		return formatedDurationMap;
	}

	async handleScroll(event) {
		const isOff = await isOffline();

		if (
			event.srcElement.body.scrollTop + window.innerHeight >
				event.srcElement.body.scrollHeight - 100 &&
			this.state.loadMore &&
			!this.state.loading &&
			!isOff
		) {
			this.loadMoreEntries();
		}
	}

	loadMoreEntries() {
		this.setState(
			{
				pageCount: this.state.pageCount + 1,
				loading: true,
			},
			() => {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'getTimeEntries',
						options: {
							page: this.state.pageCount,
						},
					})
					.then(async response => {
						const data = response.data;
						const entries = data.timeEntriesList.filter(
							entry => entry.timeInterval.end
						);
						const { durationMap, weekStatusMap, approvalPeriod, periodStatusMap } =
							data;
						const newDurationMap = this.concatDurationMap(
							this.state.durationMap,
							durationMap
						);
						const newWeekStatusMap = this.concatDurationMap(
							this.state.weekStatusMap,
							weekStatusMap
						);
						const newPeriodStatusMap = this.concatDurationMap(
							this.state.periodStatusMap,
							periodStatusMap
						);
						this.setState(
							{
								timeEntries: await this.groupEntries(
									this.state.timeEntries.concat(entries),
									newDurationMap,
									newWeekStatusMap,
									newPeriodStatusMap,
									approvalPeriod
								),
								durationMap: newDurationMap,
								weekStatusMap: newWeekStatusMap,
								periodStatusMap: newPeriodStatusMap,
								loading: false,
							},
							() => {
								if (this.state.timeEntries.length === data.allEntriesCount) {
									this.setState({
										loadMore: false,
									});
								}
							}
						);
					})
					.catch(error => {
						console.log('home-page.component.js | line 1097 | error:', error);
					});
			}
		);
	}

	concatDurationMap(oldDurationMap, newDurationMap) {
		let durationMap = {};

		for (let key in oldDurationMap) {
			durationMap[key] = oldDurationMap[key];
		}

		for (let key in newDurationMap) {
			if (!durationMap[key]) {
				durationMap[key] = newDurationMap[key];
			}
		}

		return durationMap;
	}

	changeMode(mode) {
		this.setState(
			{
				mode: mode,
			},
			() => {
				localStorage.setItem('mode', mode);
			}
		);
	}

	startTimeChanged(time) {
		this.setState({
			time: time,
		});
	}

	inProgress(inProgress) {
		this.setState(
			{
				inProgress: inProgress,
			},
			() => {
				localStorage.setItem('inProgress', !!inProgress);
				localStorage.setItem('timeEntryInProgress', inProgress);
			}
		);
	}

	async endStartedAndStart(timeEntry) {
		if (await isOffline()) {
			const inProgress = await localStorage.getItem('inProgress');
			if (inProgress && JSON.parse(inProgress)) {
				this.start.setTimeEntryInProgress(null);
			}

			if (offlineStorage.timeEntryInOffline) {
				const entry = offlineStorage.timeEntryInOffline;
				if (entry) {
					let timeEntries = this.timeEntriesOffline;
					entry.timeInterval.end = moment();
					timeEntries.push(entry);
					offlineStorage.timeEntriesOffline = timeEntries;
				}
			}

			let timeEntryNew = {
				id: offlineStorage.timeEntryIdTemp,
				description: timeEntry.description,
				timeInterval: { start: moment() },
				projectId: timeEntry.projectId,
				taskId: timeEntry.task ? timeEntry.task.id : null,
				tagIds: timeEntry.tags ? timeEntry.tags.map(tag => tag.id) : [],
				billable: timeEntry.billable,
				customFieldValues: offlineStorage.customFieldValues, // generated from wsCustomFields
			};

			offlineStorage.timeEntryInOffline = timeEntryNew;
			this.start.setTimeEntryInProgress(timeEntryNew);
			this.handleRefresh();
		} else {
			const { projectId, billable, task, description, customFieldValues, tags } = timeEntry;
			const taskId = task ? task.id : null;
			const tagIds = tags ? tags.map(tag => tag.id) : [];

			getBrowser()
				.runtime.sendMessage({
					eventName: 'endInProgress',
					options: {
						endedFromIntegration: false,
					},
				})
				.then(() => {
					// getBrowser().extension.getBackgroundPage().removeIdleListenerIfIdleIsEnabled();
					getBrowser().runtime.sendMessage({
						eventName: 'removeIdleListenerIfIdleIsEnabled',
					});
					// getBrowser().extension.getBackgroundPage().setTimeEntryInProgress(null);
					localStorage.setItem('timeEntryInProgress', null);
					this.getTimeEntries();

					const cfs =
						customFieldValues && customFieldValues.length > 0
							? customFieldValues
									.filter(
										({ customFieldDto }) => customFieldDto.status === 'VISIBLE'
									)
									.map(({ type, customFieldId, value }) => ({
										customFieldId,
										sourceType: 'TIMEENTRY',
										value: type === 'NUMBER' ? parseFloat(value) : value,
									}))
							: [];

					getBrowser()
						.runtime.sendMessage({
							eventName: 'startWithDescription',
							options: {
								projectId,
								description,
								billable,
								start: null,
								end: null,
								taskId,
								tagIds,
								customFields: cfs,
							},
						})
						.then(response => {
							let data = response.data;
							this.start.getTimeEntryInProgress();

							// getBrowser().extension.getBackgroundPage().addIdleListenerIfIdleIsEnabled();
							getBrowser().runtime.sendMessage({
								eventName: 'addIdleListenerIfIdleIsEnabled',
							});
							// getBrowser().extension.getBackgroundPage().setTimeEntryInProgress(data);
							localStorage.setItem('timeEntryInProgress', data);
						})
						.catch(() => {});
				})
				.catch(() => {});
		}
	}

	async checkRequiredFields(timeEntry) {
		const { forceProjects, forceTasks, forceTags, forceDescription } =
			this.state.workspaceSettings;
		const { mode, inProgress } = this.state;
		if (await isOffline()) {
			this.endStartedAndStart(timeEntry);
		} else if (forceDescription && (inProgress.description === '' || !inProgress.description)) {
			window.reactRoot.render(
				<RequiredFields
					field={'description'}
					mode={mode}
					goToEdit={this.goToEdit.bind(this)}
				/>
			);
		} else if (forceProjects && !inProgress.projectId) {
			window.reactRoot.render(
				<RequiredFields field={'project'} mode={mode} goToEdit={this.goToEdit.bind(this)} />
			);
		} else if (forceTasks && !inProgress.task) {
			window.reactRoot.render(
				<RequiredFields field={'task'} mode={mode} goToEdit={this.goToEdit.bind(this)} />
			);
		} else if (
			forceTags &&
			(!this.state.timeEntry.tags || !this.state.timeEntry.tags.length > 0)
		) {
			window.reactRoot.render(
				<RequiredFields field={'tags'} mode={mode} goToEdit={this.goToEdit.bind(this)} />
			);
		} else {
			this.endStartedAndStart(timeEntry);
		}
	}

	goToEdit() {
		window.reactRoot.render(
			<EditForm
				changeMode={this.changeMode}
				timeEntry={this.state.inProgress}
				workspaceSettings={this.state.workspaceSettings}
				timeFormat={this.state.userSettings.timeFormat}
				userSettings={this.state.userSettings}
			/>
		);
	}

	async continueTimeEntry(timeEntry) {
		if (this.state.inProgress) {
			this.checkRequiredFields(timeEntry);
		} else {
			if (await isOffline()) {
				let timeEntryOffline = {
					id: offlineStorage.timeEntryIdTemp,
					description: timeEntry.description,
					timeInterval: {
						start: moment(),
					},
					billable: timeEntry.billable,
					customFieldValues: offlineStorage.customFieldValues, // generated from wsCustomFields
					loadMore: false,
				};

				offlineStorage.timeEntryInOffline = timeEntryOffline;
				this.start.setTimeEntryInProgress(timeEntryOffline);
			} else {
				getBrowser()
					.runtime.sendMessage({
						eventName: 'continueEntry',
						options: {
							timeEntryId: timeEntry.id,
						},
					})
					.then(response => {
						let data = response.data;
						this.start.getTimeEntryInProgress();
						getBrowser().runtime.sendMessage({
							eventName: 'addIdleListenerIfIdleIsEnabled',
						});
						localStorage.setItem('timeEntryInProgress', data);
						this.application.setIcon(getIconStatus().timeEntryStarted);
					})
					.catch(() => {});
			}
		}
	}

	async handleRefresh(check = false) {
		if (check) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getEntryInProgress',
				})
				.then(response => {
					// if there is no time entry in progress, then we can safely sync offline entries
					!response.data && this.triggerOfflineEntrySync();
				})
				.finally(() => {
					this.reloadData();
				});
		} else {
			this.reloadData();
		}
	}

	async triggerOfflineEntrySync() {
		if (!(await isOffline())) {
			getBrowser()
				.runtime.sendMessage({
					eventName: 'getEntryInProgress',
				})
				.then(response => {
					// if there is no time entry in progress, then we can safely sync offline entries
					if (!response.data) this.saveAllOfflineEntries();
					else this.toaster.toast('error', "Can't sync while entry in progress", 2);
				});
		}
	}

	async reloadData(reload = false) {
		this.log('reloadData ' + (reload ? 'mount (why without unmount?)' : ''));
		if (!(await isOffline())) {
			this.setState(
				{
					pageCount: 0,
				},
				() => {
					this.getTimeEntries(reload);
				}
			);
			if (this.start) {
				this.start.getTimeEntryInProgress();
			}
		} else {
			this.getTimeEntries(reload);
		}
	}

	enableAllIntegrationsButtonIfNoneIsEnabled() {
		getBrowser().storage.local.get('permissions', async result => {
			const { permissions } = result;
			const userId = await localStorage.getItem('userId');

			if (permissions && permissions.length > 0) {
				const permissionForUser = permissions.filter(
					permission => permission.userId === userId
				);
				if (
					permissionForUser.length > 0 &&
					permissionForUser[0].permissions.filter(p => !p.isCustom).length > 0
				) {
					return;
				}
			}
			this.setClockifyOriginsToStorage(userId);
		});
	}

	setClockifyOriginsToStorage(userId) {
		fetch('integrations/integrations.json')
			.then(response => response.json())
			.then(clockifyOrigins => {
				getBrowser().storage.local.get('permissions', result => {
					const permissionsForStorage = result.permissions ? result.permissions : [];
					let arr = permissionsForStorage.filter(
						permission => permission.userId === userId
					);
					let permissionForUser;
					if (arr.length === 0) {
						permissionForUser = {
							userId,
							permissions: [],
						};
						permissionsForStorage.push(permissionForUser);
					} else {
						permissionForUser = arr[0];
					}

					for (let key in clockifyOrigins) {
						permissionForUser.permissions.push({
							domain: key,
							isEnabled: true,
							script: clockifyOrigins[key].script,
							name: clockifyOrigins[key].name,
							isCustom: false,
						});
					}

					getBrowser().storage.local.set({
						permissions: permissionsForStorage,
					});
				});
			});
	}

	showMessage(message, n) {
		this.toaster.toast('info', message, n || 2);
	}

	clearEntries() {
		this.setState({
			timeEntries: [],
			ready: false,
		});
	}

	async getPomodoroForUser() {
		const userId = await localStorage.getItem('userId');
		const permanent_pomodoro = await localStorage.getItem('permanent_pomodoro');
		return permanent_pomodoro
			? JSON.parse(permanent_pomodoro).find(item => item.userId === userId)
			: null;
	}

	preventDragHandler(e) {
		e.preventDefault();
	}

	render() {
		const {
			inProgress,
			isOffline,
			mode,
			ready,
			activeWorkspaceId,
			isFocusModeEnabled,
			workspaceSettings,
			features,
			timeEntries,
			userSettings,
			manualModeDisabled,
			isUserOwnerOrAdmin,
			pullToRefresh,
			dates,
			groups,
			pomodoroTimeInterval,
			pomodoroShortBreak,
			pomodoroLongBreak,
			pomodoroEnabled,
			wasRegionalEverAllowed,
			selfHosted,
		} = this.state;

		const timeEntriesOffline = offlineStorage.timeEntriesOffline.filter(
			timeEntry => !timeEntry.workspaceId || timeEntry.workspaceId === activeWorkspaceId
		);

		const isTrackingDisabled =
			!selfHosted &&
			ready &&
			isUserOwnerOrAdmin !== null &&
			features &&
			!features.includes('TIME_TRACKING');
		return (
			<div
				onDragStart={this.preventDragHandler}
				onDrop={this.preventDragHandler}
				className="home_page"
				style={{
					paddingTop: isTrackingDisabled || this.props.bannerVisible ? '220px' : '134px',
				}}>
				{_withLogger && <Logger ref={this.loggerRef} />}
				{isTrackingDisabled && (
					<div className="clockify-subscription-expired-overlay"></div>
				)}
				<ModalsContainer />
				{
					<>
						<div className="header_and_timer">
							{isTrackingDisabled && (
								<div className="clockify-subscription-expired-overlay"></div>
							)}
							<Header
								ref={instance => {
									this.header = instance;
								}}
								showActions={true}
								showSync={true}
								changeMode={this.changeMode}
								disableManual={!!inProgress}
								disableAutomatic={false}
								handleRefresh={this.handleRefresh}
								workspaceSettings={workspaceSettings}
								isTrackerPage={true}
								workspaceChanged={this.workspaceChanged}
								isOffline={isOffline}
								toaster={this.toaster}
								mode={mode}
								manualModeDisabled={manualModeDisabled}
								clearEntries={this.clearEntries}
								isTrackingDisabled={isTrackingDisabled}
							/>
							{isTrackingDisabled && (
								<div className="clockify-subscription-expired-message">
									<img src="../assets/images/warning_24px.png" />
									<p>
										{!wasRegionalEverAllowed
											? isUserOwnerOrAdmin
												? locales.UPGRADE_REGIONAL_ADMIN
												: locales.UPGRADE_REGIONAL
											: isUserOwnerOrAdmin
											? locales.SUBSCRIPTION_EXPIRED
											: locales.FEATURE_DISABLED_CONTACT_ADMIN}
									</p>
								</div>
							)}
							<BannerContainer />
							<Toaster
								ref={instance => {
									this.toaster = instance;
								}}
							/>
							<StartTimer
								ref={instance => {
									this.start = instance;
								}}
								message={this.showMessage.bind(this)}
								mode={mode}
								changeMode={this.changeMode}
								endStarted={this.handleRefresh}
								setTimeEntryInProgress={this.inProgress.bind(this)}
								workspaceSettings={workspaceSettings}
								startTimeChanged={this.startTimeChanged.bind(this)}
								features={features}
								timeEntries={timeEntries}
								timeFormat={userSettings.timeFormat}
								userSettings={userSettings}
								toaster={this.toaster}
								log={this.log}
								activeWorkspaceId={this.state.activeWorkspaceId}
							/>
						</div>
						<div
							className={
								!isOffline && timeEntriesOffline && timeEntriesOffline.length > 0
									? ''
									: 'disabled'
							}>
							{!isOffline && timeEntriesOffline.length > 0 && (
								<TimeEntryListNotSynced
									inProgress={inProgress}
									timeEntries={timeEntriesOffline}
									pullToRefresh={pullToRefresh}
									handleRefresh={this.handleRefresh}
									triggerOfflineEntrySync={this.triggerOfflineEntrySync}
									workspaceSettings={workspaceSettings}
									features={features}
									timeFormat={userSettings.timeFormat}
									userSettings={userSettings}
									isUserOwnerOrAdmin={isUserOwnerOrAdmin}
									manualModeDisabled={this.state.manualModeDisabled}
								/>
							)}
						</div>
						{pomodoroEnabled && isFocusModeEnabled && inProgress ? (
							<div>
								<CountdownTimer
									interval={
										inProgress.description === 'Pomodoro break'
											? pomodoroShortBreak
											: inProgress.description === 'Pomodoro long break'
											? pomodoroLongBreak
											: pomodoroTimeInterval
									}
									currentTime={
										inProgress?.timeInterval?.start
											? moment(inProgress.timeInterval.start)
											: moment()
									}
									isBreak={
										inProgress.description === 'Pomodoro break' ||
										inProgress.description === 'Pomodoro long break'
									}
								/>
							</div>
						) : (
							<div
								className={
									timeEntries.length === 0
										? 'time-entry-list__offline'
										: 'time-entry-list'
								}>
								<TimeEntryList
									timeEntries={timeEntries}
									isLoading={!this.state.ready}
									dates={dates}
									groups={groups}
									timeChange={this.state.time}
									selectTimeEntry={this.continueTimeEntry.bind(this)}
									pullToRefresh={pullToRefresh}
									handleRefresh={this.handleRefresh}
									changeMode={this.changeMode}
									timeFormat={userSettings.timeFormat}
									workspaceSettings={workspaceSettings}
									features={features}
									userSettings={userSettings}
									isOffline={isOffline}
									isUserOwnerOrAdmin={isUserOwnerOrAdmin}
									manualModeDisabled={this.state.manualModeDisabled}
								/>
							</div>
						)}
					</>
				}
			</div>
		);
	}
}

const selectedState = state => ({
	bannerVisible: state.bannerVisible,
	workspaceLockData: state.workspaceLockData,
	toggleTimerShortcut: state.toggleTimerShortcut,
	userData: state.userData,
	usersTimerShortcutPreferences: state.usersTimerShortcutPreferences,
});

export default mapStateToProps(selectedState)(HomePage);
