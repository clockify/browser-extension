import * as React from 'react';
import Settings from './settings.component';
import { getBrowser, isChrome } from '~/helpers/browser-helper';
import { getEnv } from '~/environment';
import WorkspaceList from './workspace-list.component';
import WorkspaceChangeConfirmation from './workspace-change-confirmation.component';
import { ExtParameters } from '~/wrappers/ext-parameters';
import locales from '../helpers/locales';
import WsChange2FAPopupComponent from '../components/ws-change-2fa-popup.component';
import SelfHostedBootSettings from '../components/self-hosted-login-settings.component';
import { logout } from '~/helpers/utils';
import dateFnsLocale from './date-fns-locale';
import { getLocalStorageEnums } from '~/enums/local-storage.enum';
import { removeDarkModeClassFromBodyElement } from '~/zustand/slices/darkThemeSlice';

const environment = getEnv();
const extParameters = new ExtParameters();

class Menu extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			workspaceChangeConfirmationIsOpen: false,
			selectedWorkspaceId: null,
			revert: false,
			workspaceNameSelected: '',
			subDomainName: '',
			isOffline: null,
			show2FAPopup: false,
			workspaces: [],
			selectedWorkspace: null,
			previousWorkspace: null,
			userSettingsData: {
				daysOfWeek: [
					{ id: 1, name: 'MON', active: true },
					{ id: 2, name: 'TUE', active: true },
					{ id: 3, name: 'WED', active: true },
					{ id: 4, name: 'THU', active: true },
					{ id: 5, name: 'FRI', active: true },
					{ id: 6, name: 'SAT', active: false },
					{ id: 7, name: 'SUN', active: false },
				],
			},
		};

		// this.onSetWorkspace = this.onSetWorkspace.bind(this);
		this.changeToSubdomainWorkspace = this.changeToSubdomainWorkspace.bind(this);
		this.cancelSubdomainWorkspaceChange = this.cancelSubdomainWorkspaceChange.bind(this);
		this.changeModeToManual = this.changeModeToManual.bind(this);
		this.getWorkspaces = this.getWorkspaces.bind(this);
		this.handleIntegrationsRefresh = this.handleIntegrationsRefresh.bind(this);
	}

	componentDidMount() {
		this.getWorkspaces();
		this.getUserSettings();
		this.setAsyncUserItems();
	}

	async componentDidUpdate(prevProps) {
		const isOffline = JSON.parse(await localStorage.getItem('offline'));
		if (this.state.isOffline !== isOffline) {
			this.setState({
				isOffline,
			});
		}
		if (this.props.workspaceSettings !== prevProps.workspaceSettings) {
			this.getWorkspaces();
		}
	}

	getUserSettings() {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getUser',
			})
			.then(response => {
				let data = response.data;
				this.setState(
					prevState => ({
						userSettingsData: {
							...prevState.userSettingsData,
							user: data,
							userId: data.id,
							userEmail: data.email,
							userPicture: data.profilePicture,
							userTimeFormat: data.settings.timeFormat,
							userStartOfDay: data.settings.myStartOfDay,
						},
					}),
					() => {
						localStorage.setItem('userEmail', this.state.userEmail);
						localStorage.setItem('profilePicture', this.state.userPicture);
						this.getMemberProfile();
						this.isIdleDetectionOn();
						this.isReminderOn();
						this.isAutoStartStopOn();
						this.isAppendWebsiteURLOn();
						this.getAppVersion();
					}
				);
			});
	}

	async getMemberProfile() {
		const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId');
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getMemberProfile',
				options: { userId: this.state.userId, workspaceId: activeWorkspaceId },
			})
			.then(response => {
				this.setState(
					prevState => ({
						userSettingsData: {
							...prevState.userSettingsData,
							memberProfile: response.data,
						},
					}),
					() => {
						this.isStopTimerOnSelectedTimeOn();
					}
				);
			});
	}

	async isIdleDetectionOn() {
		const idleDetectionFromStorage = await localStorage.getItem('idleDetection');
		const userId = await localStorage.getItem('userId');

		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				idleDetectionCounter:
					idleDetectionFromStorage &&
					JSON.parse(idleDetectionFromStorage).filter(
						idleDetectionByUser =>
							idleDetectionByUser.userId === userId && idleDetectionByUser.counter > 0
					).length > 0
						? JSON.parse(idleDetectionFromStorage).filter(
								idleDetectionByUser =>
									idleDetectionByUser.userId === userId &&
									idleDetectionByUser.counter > 0
						  )[0].counter
						: 0,
				idleDetection: !!(
					idleDetectionFromStorage &&
					JSON.parse(idleDetectionFromStorage).filter(
						idleDetectionByUser =>
							idleDetectionByUser.userId === userId && idleDetectionByUser.counter > 0
					).length > 0
				),
			},
		}));
	}

	async isReminderOn() {
		const reminderFromStorage = await localStorage.getItem('reminders');
		const userId = await localStorage.getItem('userId');
		const reminderFromStorageForUser = reminderFromStorage
			? JSON.parse(reminderFromStorage).filter(reminder => reminder.userId === userId)[0]
			: null;

		if (!reminderFromStorageForUser) {
			return;
		}

		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				reminder: reminderFromStorageForUser.enabled,
			},
		}));
		setTimeout(() => this.checkForRemindersDatesAndTimes(), 200);
	}

	async isAutoStartStopOn() {
		const userId = await localStorage.getItem('userId');
		const autoStartOnBrowserStart = await localStorage.getItem('autoStartOnBrowserStart');
		const autoStartFromStorage = autoStartOnBrowserStart
			? JSON.parse(autoStartOnBrowserStart)
			: [];
		const autoStopOnBrowserClose = await localStorage.getItem('autoStopOnBrowserClose');
		const autoStopFromStorage = autoStopOnBrowserClose
			? JSON.parse(autoStopOnBrowserClose)
			: [];

		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				autoStartOnBrowserStart:
					autoStartFromStorage.filter(
						autoStart => autoStart.userId === userId && autoStart.enabled
					).length > 0,
				autoStopOnBrowserClose:
					autoStopFromStorage.filter(
						autoStop => autoStop.userId === userId && autoStop.enabled
					).length > 0,
			},
		}));
	}

	async isAppendWebsiteURLOn() {
		const appendWebsiteURL = await localStorage.getItem('appendWebsiteURL');
		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				appendWebsiteURL,
			},
		}));
	}

	async getAppVersion() {
		const appVersion = await localStorage.getItem('appVersion');
		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				appVersion,
			},
		}));
	}

	async isStopTimerOnSelectedTimeOn() {
		const userData = this.state.userSettingsData.user;
		const stopTimerOnSelectedTime = await localStorage.getItem('stopTimerOnSelectedTime');
		let defaultStopTime = this.getDefaultStopTime(userData.settings.myStartOfDay);
		//if there is no stopTimerOnSelectedTime in local storage, set it to default
		if (!stopTimerOnSelectedTime) {
			localStorage.setItem(
				'stopTimerOnSelectedTime',
				JSON.stringify([
					{
						userId: userData.id,
						enabled: false,
						time: defaultStopTime,
					},
				]),
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.setState(prevState => ({
				userSettingsData: {
					...prevState.userSettingsData,
					timeToStopTimer: defaultStopTime,
				},
			}));
			return;
		}

		const parsedStopTimerOnSelectedTime = JSON.parse(stopTimerOnSelectedTime);

		let stopTimerOnSelectedTimeForUser = undefined;
		if (stopTimerOnSelectedTime.length > 0) {
			stopTimerOnSelectedTimeForUser = parsedStopTimerOnSelectedTime.find(
				stopTimerOnSelectedTime => {
					return stopTimerOnSelectedTime.userId === userData.id;
				}
			);
		}
		// if there is no stopTimerOnSelectedTime for the user, set it to default
		if (!stopTimerOnSelectedTimeForUser) {
			localStorage.setItem(
				'stopTimerOnSelectedTime',
				JSON.stringify([
					...JSON.parse(stopTimerOnSelectedTime),
					{
						userId: userData.id,
						enabled: false,
						time: defaultStopTime,
					},
				]),
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.setState(prevState => ({
				userSettingsData: {
					...prevState.userSettingsData,
					timeToStopTimer: defaultStopTime,
				},
			}));
			return;
		}
		this.setState(
			prevState => ({
				userSettingsData: {
					...prevState.userSettingsData,
					stopTimerOnSelectedTime: stopTimerOnSelectedTimeForUser.enabled,
					timeToStopTimer: stopTimerOnSelectedTimeForUser.time,
				},
			}),
			() => {
				getBrowser().runtime.sendMessage({ eventName: 'createStopTimerEvent' });
			}
		);
	}

	getDefaultStopTime(startTime) {
		let formattedTime = '17:00';
		// if (this.state.reminderSettings) {
		if (
			this.state.userSettingsData.memberProfile &&
			this.state.userSettingsData.memberProfile.workCapacity
		) {
			let [hours, minutes] = startTime.split(':');

			// Initialize a Date object with the current date and the specified hours and minutes
			let date = new Date();
			date.setHours(hours);
			date.setMinutes(minutes);

			function checkTime(i) {
				if (i < 10) {
					i = '0' + i;
				}
				return i;
			}
			// Extract the number of hours and minutes from the work capacity string
			// The work capacity string is in the format "PT3H30M", where the number of hours is 3 and the number of minutes is 30
			const capacityHours =
				this.state.userSettingsData.memberProfile.workCapacity.match(/\d+H/)[0]; // extract the number of hours
			const capacityMinutes =
				this.state.memberProfile.userSettingsData.workCapacity.match(/\d+M/); // try to extract the number of minutes
			const hoursAsNumber = parseInt(capacityHours.slice(0, -1), 10); // convert the hours string to a number
			const minutesAsNumber = capacityMinutes
				? parseInt(capacityMinutes[0].slice(0, -1), 10)
				: 0; // convert the minutes string to a number, or use 0 if no minutes are present
			const timeInHours = hoursAsNumber + minutesAsNumber / 60;

			date.setMinutes(date.getMinutes() + parseFloat(timeInHours) * 60);
			// Format the hours and minutes as a string in HH:mm format
			let h = checkTime(date.getHours());
			let m = checkTime(date.getMinutes());

			formattedTime = `${h}:${m}`;
		}

		return formattedTime;
	}

	async checkForRemindersDatesAndTimes() {
		const userId = await localStorage.getItem('userId');
		const reminderDatesAndTimesFromStorageForUser = JSON.parse(
			await localStorage.getItem('reminderDatesAndTimes')
		).filter(reminderDatesAndTimes => reminderDatesAndTimes.userId === userId)[0];

		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				reminderFromTime: reminderDatesAndTimesFromStorageForUser.timeFrom,
				reminderToTime: reminderDatesAndTimesFromStorageForUser.timeTo,
				reminderMinutesSinceLastEntry: parseInt(
					reminderDatesAndTimesFromStorageForUser.minutesSinceLastEntry
				),
				daysOfWeek: prevState.userSettingsData.daysOfWeek.map(day => ({
					...day,
					active: reminderDatesAndTimesFromStorageForUser.dates.includes(day.id),
				})),
			},
		}));
	}
	async setAsyncUserItems() {
		const createObjects = JSON.parse(await localStorage.getItem('createObjects', false));
		const isSelfHosted = JSON.parse(await localStorage.getItem('selfHosted', false));
		const daysOfWeekLocales = await dateFnsLocale.getDaysShort();
		const userEmail = await localStorage.getItem('userEmail');
		const userPicture = await localStorage.getItem('profilePicture');

		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
				createObjects,
				isSelfHosted,
				daysOfWeekLocales,
				userEmail,
				userPicture,
			},
		}));
	}

	getWorkspaces() {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getWorkspacesOfUser',
			})
			.then(async response => {
				let data = response.data;
				const activeWorkspaceId = await localStorage.getItem('activeWorkspaceId');
				let selectedWorkspace = data.filter(
					workspace => workspace.id === activeWorkspaceId
				)[0];
				this.setState({
					workspaces: data,
					selectedWorkspace: selectedWorkspace,
					previousWorkspace: selectedWorkspace,
				});
			})
			.catch(() => {});
	}

	changeModeToManual() {
		if (
			this.props.mode === 'manual' ||
			this.props.manualModeDisabled ||
			this.props.isTrackingDisabled
		)
			return;
		if (!JSON.parse(this.props.disableManual)) {
			this.props.changeModeToManual();
		}
	}

	changeModeToTimer() {
		if (this.props.mode === 'timer') return;
		if (!JSON.parse(this.props.disableAutomatic)) {
			this.props.changeModeToTimer();
		}
	}

	async openSettings() {
		if (this.props.isTrackingDisabled) {
			return;
		}
		if (!JSON.parse(await localStorage.getItem('offline'))) {
			window.reactRoot.render(
				<Settings
					userSettingsData={this.state.userSettingsData}
					getDefaultStopTime={this.getDefaultStopTime}
					workspaceSettings={this.props.workspaceSettings}
				/>
			);
		}
	}

	openUrlPermissions() {
		if (this.state.isOffline || this.props.isTrackingDisabled) return;
		getBrowser().runtime.openOptionsPage();
	}

	handleLogoutClick() {
		if (this.state.isOffline) return;
		this.disconnectWebSocket();
		removeDarkModeClassFromBodyElement();
		logout();
		//if (!isChrome()) localStorage.removeItem('subDomainName');
	}

	async openWebDashboard() {
		if (this.state.isOffline || this.props.isTrackingDisabled) return;
		const homeUrl = (await localStorage.getItem('homeUrl')) || environment.home;
		window.open(`${homeUrl}/dashboard`, '_blank');
		if (!isChrome()) {
			browser.tabs.create({
				url: `${homeUrl}/dashboard`,
			});
		}
	}

	async disconnectWebSocket() {
		const selfHosted = await localStorage.getItem('selfhosted_selfHosted');
		if (!JSON.parse(selfHosted)) {
			getBrowser().runtime.sendMessage({
				eventName: 'webSocketDisconnect',
			});
		}
	}

	cancelSubdomainWorkspaceChange() {
		this.setState({
			revert: true,
			workspaceChangeConfirmationIsOpen: false,
			subDomainName: '',
		});
	}

	changeToSubdomainWorkspace() {
		this.setState({
			revert: false,
			workspaceChangeConfirmationIsOpen: false,
		});

		extParameters.setSubDomainName(this.state.subDomainName);
		this.handleLogoutClick.bind(this)();
		setTimeout(() => {
			window.reactRoot.render(
				<SelfHostedBootSettings url={`https://${this.state.subDomainName}.clockify.me`} />
			);
		}, 200);
	}

	handleIntegrationsRefresh() {
		getBrowser().runtime.sendMessage({
			eventName: 'refreshIntegrationsClicked',
		});
	}

	render() {
		const title = this.props.disableManual
			? locales.ENTRY_IN_PROGRESS_EXISTS
			: this.props.manualModeDisabled
			? locales.DISABLED_MANUAL_MODE
			: '';
		if (this.props.isOpen) {
			return (
				<div title="">
					<div className="rectangle"></div>
					<div className="dropdown-menu">
						<div className="dropdown-header">{locales.ENTRY_MODE}</div>
						<a
							id="manual"
							className={
								JSON.parse(this.props.disableManual) ||
								this.props.manualModeDisabled ||
								this.props.isTrackingDisabled
									? 'dropdown-item disable-manual'
									: this.props.mode === 'manual'
									? 'dropdown-item active'
									: 'dropdown-item'
							}
							href="#"
							onClick={this.changeModeToManual}
							title={title}>
							<span className="menu-manual-img"></span>
							<span
								className={
									JSON.parse(this.props.disableManual) ||
									this.props.isTrackingDisabled
										? 'disable-manual'
										: ''
								}>
								{locales.TRACKER__TIME_TRACKER__ENTRY__TRACK__MANUAL_M}
							</span>
						</a>
						<a
							id="timer"
							className={
								this.props.mode === 'timer'
									? 'dropdown-item active'
									: 'dropdown-item'
							}
							href="#"
							onClick={this.changeModeToTimer.bind(this)}>
							<span className="menu-timer-img"></span>
							<span>
								{locales.TRACKER__TIME_TRACKER__ENTRY__TRACK__TIMER_N}
							</span>
						</a>
						<div className="dropdown-divider"></div>
						<WorkspaceList
							revert={this.state.revert}
							selectWorkspace={this.props.selectWorkspace}
							workspaces={this.state.workspaces}
							selectedWorkspace={this.state.selectedWorkspace}
							previousWorkspace={this.state.previousWorkspace}
						/>
						<a
							onClick={this.openSettings.bind(this)}
							className="dropdown-item"
							href="#">
							<span
								className={
									this.state.isOffline || this.props.isTrackingDisabled
										? 'disable-manual'
										: ''
								}>
								{locales.SETTINGS}
							</span>
						</a>
						<span className="dropdown-item subitem-container" href="#">
							<a
								className="dropdown-subitem"
								href="#"
								onClick={this.openUrlPermissions.bind(this)}
								style={{ width: '100%' }}>
								<span
									className={
										this.state.isOffline || this.props.isTrackingDisabled
											? 'disable-manual'
											: ''
									}>
									{locales.INTEGRATIONS}
								</span>
							</a>
							<a
								className="dropdown-subitem"
								href="#"
								onClick={this.handleIntegrationsRefresh}
								title={locales.REFRESH}>
								<span className="refresh-icon" style={{ margin: '0' }}></span>
							</a>
						</span>
						<a
							onClick={this.openWebDashboard.bind(this)}
							className="dropdown-item"
							href="#">
							<span
								className={
									this.state.isOffline || this.props.isTrackingDisabled
										? 'disable-manual'
										: ''
								}>
								{locales.DASHBOARD}
							</span>
							<span className="menu-img-right"></span>
						</a>
						<a
							onClick={this.handleLogoutClick.bind(this)}
							className="dropdown-item"
							href="#">
							<span className={this.state.isOffline ? 'disable-manual' : ''}>
								{locales.LOG_OUT}
							</span>
						</a>
					</div>

					{this.state.workspaceChangeConfirmationIsOpen && (
						<WorkspaceChangeConfirmation
							canceled={this.cancelSubdomainWorkspaceChange}
							confirmed={this.changeToSubdomainWorkspace}
							workspaceName={this.state.workspaceNameSelected}
							isChrome={isChrome()}
						/>
					)}

					{this.state.show2FAPopup && (
						<WsChange2FAPopupComponent
							cancel={() => this.setState({ show2FAPopup: false, revert: true })}
							workspaceName={this.state.workspaceNameSelected}
						/>
					)}
				</div>
			);
		} else {
			return null;
		}
	}
}

export default Menu;
