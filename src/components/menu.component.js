import * as React from 'react';
import Settings from './settings.component';
import { getBrowser, isChrome } from '~/helpers/browser-helper';
import { getEnv } from '~/environment';
import WorkspaceList from './workspace-list.component';
import { WorkspaceChangeConfirmation } from '~/components/WorkspaceChangeConfirmation';
import { ExtParameters } from '~/wrappers/ext-parameters';
import locales from '../helpers/locales';
import SelfHostedBootSettings from '../components/self-hosted-login-settings.component';
import { logout } from '~/helpers/utils';
import { getLocalStorageEnums } from '~/enums/local-storage.enum';
import { removeDarkModeClassFromBodyElement } from '~/zustand/slices/darkThemeSlice';
import { dateFnsLocale } from '~/components/DateFnsLocale';
import FeedbackPage from './FeedbakPage/FeedbackPage';

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
				options: {
					userId: this.state.userSettingsData.userId,
					workspaceId: activeWorkspaceId,
				},
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
			const workCapacity = this.state.userSettingsData.memberProfile.workCapacity;
			const capacityHours = workCapacity.match(/\d+H/)[0]; // extract the number of hours
			const capacityMinutes = workCapacity.match(/\d+M/); // try to extract the number of minutes
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
		const isSelfHosted = JSON.parse(await localStorage.getItem('selfHosted', false));
		const daysOfWeekLocales = await dateFnsLocale.getDaysShort();
		const userEmail = await localStorage.getItem('userEmail');
		const userPicture = await localStorage.getItem('profilePicture');

		this.setState(prevState => ({
			userSettingsData: {
				...prevState.userSettingsData,
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

	async openShareFeedbackPage() {
		if (JSON.parse(await localStorage.getItem('offline'))) return;

		const feedbackLocales = await localStorage.getItem('feedbackFormData');

		const currentLanguageForUser = await localStorage.getItem('lang');
		const languageOfFeedbackData = await localStorage.getItem('feedbackFormDataLang');

		const isStoredFeedbackDataInAppropriateLanguage =
			currentLanguageForUser === languageOfFeedbackData;

		if (feedbackLocales && isStoredFeedbackDataInAppropriateLanguage) {
			const { platformOptions, categoryOptions } = feedbackLocales;

			window.reactRoot.render(
				<FeedbackPage platformOptions={platformOptions} categoryOptions={categoryOptions} />
			);
		} else {
			const { sendMessage } = getBrowser().runtime;
			const { data } = await sendMessage({ eventName: 'getFeedbackLocalizationKeys' });
			const { platformOptions, categoryOptions } = data;

			await localStorage.setItem('feedbackFormData', data);
			await localStorage.setItem('feedbackFormDataLang', currentLanguageForUser);

			window.reactRoot.render(
				<FeedbackPage platformOptions={platformOptions} categoryOptions={categoryOptions} />
			);
		}
	}

	openUrlPermissions() {
		if (this.state.isOffline || this.props.isTrackingDisabled) return;
		getBrowser().runtime.openOptionsPage();
	}

	async handleLogoutClick() {
		if (this.state.isOffline) return;
		await getBrowser().runtime.sendMessage({
			eventName: 'sendAnalyticsEvents',
			options: { forceClearEvents: true },
		});
		this.disconnectWebSocket();
		removeDarkModeClassFromBodyElement();
		await getBrowser().runtime.sendMessage({ eventName: 'invalidateToken' });
		logout();
		//if (!isChrome()) localStorage.removeItem('subDomainName');
	}

	async openWebDashboard() {
		if (this.state.isOffline || this.props.isTrackingDisabled) return;

		const homeUrl = (await localStorage.getItem('homeUrl')) || environment.home;
		window.open(`${homeUrl}/dashboard`, '_blank');
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

		const iconColor = document.body.classList.contains('clockify-dark-mode')
			? '#999999'
			: '#455A64';

		if (this.props.isOpen) {
			return (
				<div title="">
					<div className="rectangle"></div>
					<div className="dropdown-menu">
						{/* <a 	
							href="#"> 
							className="item">
							onClick={this.openSettings.bind(this)}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_17888_1481"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_17888_1481)">
									<path
										d="M17.5521 36.9458C17.0141 36.9458 16.5435 36.773 16.1404 36.4275C15.7374 36.0819 15.4989 35.6447 15.425 35.1158L14.8834 31.5783C14.4553 31.4222 14.0107 31.2105 13.5496 30.9433C13.0885 30.6764 12.6767 30.3998 12.3142 30.1137L9.07378 31.5862C8.561 31.8057 8.04489 31.8304 7.52545 31.6604C7.006 31.4904 6.60295 31.1642 6.31628 30.6817L3.89628 26.365C3.60517 25.8936 3.52142 25.3951 3.64503 24.8696C3.76864 24.3443 4.04989 23.9129 4.48878 23.5754L7.43711 21.3812C7.39767 21.1718 7.37322 20.9415 7.36378 20.6904C7.35461 20.4396 7.35003 20.2094 7.35003 20C7.35003 19.7905 7.35461 19.5604 7.36378 19.3096C7.37322 19.0585 7.39767 18.8282 7.43711 18.6187L4.48878 16.4346C4.0435 16.0971 3.76058 15.6657 3.64003 15.1404C3.51975 14.6148 3.60517 14.113 3.89628 13.635L6.31628 9.32165C6.60295 8.85026 7.00433 8.52679 7.52045 8.35123C8.03656 8.17568 8.55114 8.19762 9.0642 8.41707L12.3338 9.88957C12.6921 9.6079 13.1014 9.33512 13.5617 9.07124C14.0217 8.80762 14.4623 8.60485 14.8834 8.4629L15.425 4.89415C15.4989 4.3586 15.7374 3.91693 16.1404 3.56915C16.5435 3.22137 17.0141 3.04749 17.5521 3.04749H22.4479C22.986 3.04749 23.4566 3.22137 23.8596 3.56915C24.2627 3.91693 24.5011 4.3586 24.575 4.89415L25.1167 8.43499C25.5448 8.59554 25.9928 8.80304 26.4609 9.05749C26.9289 9.31193 27.3373 9.58929 27.6859 9.88957L30.9263 8.41707C31.4391 8.19762 31.9506 8.17568 32.4609 8.35123C32.9711 8.52679 33.3696 8.85026 33.6563 9.32165L36.1104 13.635C36.3971 14.113 36.4803 14.6194 36.36 15.1542C36.2395 15.6889 35.9566 16.1157 35.5113 16.4346L32.5529 18.5633C32.5927 18.7911 32.6182 19.0305 32.6296 19.2817C32.641 19.5328 32.6467 19.7722 32.6467 20C32.6467 20.2278 32.6404 20.4626 32.6279 20.7046C32.6154 20.9462 32.5857 21.181 32.5388 21.4087L35.4975 23.5654C35.9428 23.8843 36.2256 24.3111 36.3459 24.8458C36.4664 25.3805 36.3834 25.8869 36.0967 26.365L33.6563 30.6817C33.3696 31.1575 32.9681 31.4821 32.4517 31.6554C31.9356 31.8287 31.4211 31.8057 30.9084 31.5862L27.6729 30.1137C27.3102 30.3998 26.9034 30.68 26.4525 30.9542C26.0014 31.2283 25.5561 31.4364 25.1167 31.5783L24.575 35.1158C24.5011 35.6447 24.2627 36.0819 23.8596 36.4275C23.4566 36.773 22.986 36.9458 22.4479 36.9458H17.5521ZM18.3121 33.7892H21.6642L22.2575 29.2192C23.1623 28.9969 24.0166 28.6561 24.8204 28.1967C25.6243 27.7372 26.3503 27.1723 26.9984 26.5021L31.3146 28.3492L32.8679 25.5508L29.0854 22.7517C29.2057 22.2983 29.3006 21.8437 29.37 21.3879C29.4392 20.9323 29.4738 20.4697 29.4738 20C29.4738 19.5303 29.4438 19.0676 29.3838 18.6121C29.3238 18.1562 29.2243 17.7017 29.0854 17.2483L32.8813 14.4492L31.3146 11.6508L27.0084 13.5117C26.3789 12.8017 25.6657 12.2079 24.8688 11.7304C24.0721 11.2529 23.2017 10.9342 22.2575 10.7742L21.6879 6.21082H18.3225L17.7525 10.7708C16.8203 10.9678 15.9506 11.3004 15.1434 11.7687C14.3361 12.2371 13.6145 12.8135 12.9784 13.4979L8.68211 11.6508L7.11878 14.4492L10.8913 17.2246C10.771 17.6871 10.6761 18.1455 10.6067 18.6C10.5375 19.0544 10.5029 19.5211 10.5029 20C10.5029 20.4697 10.5375 20.9333 10.6067 21.3908C10.6761 21.8486 10.771 22.3067 10.8913 22.765L7.11878 25.5508L8.68211 28.3492L12.9784 26.4917C13.6331 27.1622 14.3646 27.7305 15.1729 28.1967C15.9813 28.6628 16.8411 29.0069 17.7525 29.2292L18.3121 33.7892ZM20.0046 25.5554C21.5416 25.5554 22.8517 25.0137 23.935 23.9304C25.0184 22.8471 25.56 21.5369 25.56 20C25.56 18.463 25.0184 17.1529 23.935 16.0696C22.8517 14.9862 21.5416 14.4446 20.0046 14.4446C18.4604 14.4446 17.1485 14.9862 16.0688 16.0696C14.9891 17.1529 14.4492 18.463 14.4492 20C14.4492 21.5369 14.9891 22.8471 16.0688 23.9304C17.1485 25.0137 18.4604 25.5554 20.0046 25.5554Z"
										fill="#455A64"
									/>
								</g>
							</svg>
							<span>{locales.SETTINGS}</span>
						</a>
						<a 								
							href="#"
							className="item">
							onClick={this.openUrlPermissions.bind(this)}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_17888_1669"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_17888_1669)">
									<path
										d="M14.9305 35.2792H7.77803C6.95109 35.2792 6.23484 34.9764 5.62928 34.3708C5.02373 33.7653 4.72095 33.049 4.72095 32.2221V25.0696C5.91845 24.9813 6.94886 24.5347 7.8122 23.73C8.67581 22.925 9.10761 21.932 9.10761 20.7508C9.10761 19.5697 8.67581 18.5764 7.8122 17.7708C6.94886 16.9656 5.91845 16.5165 4.72095 16.4238V9.27793C4.72095 8.45237 5.02373 7.73543 5.62928 7.1271C6.23484 6.51849 6.95109 6.21418 7.77803 6.21418H14.6743C14.9379 5.05362 15.4878 4.08751 16.3239 3.31585C17.16 2.5439 18.1539 2.15793 19.3055 2.15793C20.4575 2.15793 21.4515 2.5439 22.2876 3.31585C23.1237 4.08751 23.6736 5.05362 23.9372 6.21418H30.7222C31.5478 6.21418 32.2647 6.51849 32.873 7.1271C33.4816 7.73543 33.7859 8.45237 33.7859 9.27793V16.0629C34.9465 16.3265 35.8987 16.8949 36.6426 17.7679C37.3868 18.6413 37.7589 19.6538 37.7589 20.8054C37.7589 21.9574 37.3868 22.9375 36.6426 23.7458C35.8987 24.5542 34.9465 25.0902 33.7859 25.3538V32.2221C33.7859 33.049 33.4816 33.7653 32.873 34.3708C32.2647 34.9764 31.5478 35.2792 30.7222 35.2792H23.5764C23.4791 33.9625 23.0171 32.8818 22.1901 32.0371C21.3629 31.1921 20.3823 30.7696 19.2484 30.7696C18.1146 30.7696 17.1346 31.1922 16.3084 32.0375C15.4826 32.8825 15.0233 33.9631 14.9305 35.2792ZM7.87761 32.1225H12.5897C13.2528 30.4639 14.2308 29.2965 15.5239 28.6204C16.8172 27.9446 18.0593 27.6067 19.2501 27.6067C20.4215 27.6067 21.6559 27.9446 22.9534 28.6204C24.2509 29.2965 25.2398 30.4639 25.9201 32.1225H30.6226V22.3642H33.0414C33.485 22.3642 33.855 22.2158 34.1514 21.9192C34.4478 21.6225 34.5959 21.2518 34.5959 20.8071C34.5959 20.3621 34.4478 19.9914 34.1514 19.695C33.855 19.3983 33.485 19.25 33.0414 19.25H30.6226V9.37751H20.8643V6.87543C20.8643 6.43182 20.7159 6.06182 20.4193 5.76543C20.1226 5.46904 19.7519 5.32085 19.3072 5.32085C18.8622 5.32085 18.4915 5.46904 18.1951 5.76543C17.8984 6.06182 17.7501 6.43182 17.7501 6.87543V9.37751H7.87761V14.0913C9.20289 14.6704 10.2669 15.5604 11.0697 16.7613C11.8725 17.9618 12.2739 19.2939 12.2739 20.7575C12.2739 22.1958 11.8729 23.5193 11.0709 24.7279C10.269 25.9365 9.20456 26.8313 7.87761 27.4121V32.1225Z"
										fill="#455A64"
									/>
								</g>
							</svg>
							<span>{locales.INTEGRATIONS}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_18943_44256"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_18943_44256)">
									<path
										d="M10.2091 20.0834C10.2091 21.2936 10.4403 22.4741 10.9025 23.6246C11.3647 24.7752 12.0826 25.8438 13.0562 26.8304L13.3929 27.1675V25.0696C13.3929 24.5777 13.561 24.1653 13.8971 23.8325C14.2332 23.4998 14.6473 23.3334 15.1396 23.3334C15.6318 23.3334 16.0441 23.4998 16.3766 23.8325C16.7094 24.1653 16.8758 24.5777 16.8758 25.0696V31.6367C16.8758 32.1686 16.6929 32.6177 16.3271 32.9838C15.961 33.3496 15.5119 33.5325 14.98 33.5325H8.4229C7.93067 33.5325 7.51831 33.3645 7.18581 33.0284C6.85304 32.6925 6.68665 32.2785 6.68665 31.7863C6.68665 31.2941 6.8547 30.8816 7.19081 30.5488C7.52665 30.2163 7.94067 30.05 8.4329 30.05H10.9412L10.4041 29.5663C8.95304 28.2485 7.92581 26.7602 7.32248 25.1013C6.71915 23.4427 6.41748 21.77 6.41748 20.0834C6.41748 17.4059 7.11234 14.9764 8.50206 12.795C9.89206 10.6134 11.7519 8.94975 14.0816 7.8042C14.5169 7.56892 14.9648 7.57003 15.4254 7.80753C15.8857 8.04503 16.1919 8.416 16.3441 8.92045C16.4897 9.39684 16.4711 9.86823 16.2883 10.3346C16.1058 10.8013 15.7935 11.1589 15.3512 11.4075C13.7868 12.2767 12.5387 13.4793 11.6071 15.0154C10.6751 16.5516 10.2091 18.2409 10.2091 20.0834ZM29.7908 19.9167C29.7908 18.7064 29.5597 17.526 29.0975 16.3754C28.6353 15.2249 27.9173 14.1563 26.9437 13.1696L26.6071 12.8325V14.9304C26.6071 15.4224 26.4407 15.8348 26.1079 16.1675C25.7751 16.5003 25.3626 16.6667 24.8704 16.6667C24.3782 16.6667 23.9641 16.4986 23.6283 16.1625C23.2922 15.8264 23.1241 15.4124 23.1241 14.9204V8.36336C23.1241 7.83142 23.3071 7.38239 23.6729 7.01628C24.039 6.65045 24.488 6.46753 25.02 6.46753H31.5771C32.0693 6.46753 32.4816 6.63392 32.8141 6.9667C33.1469 7.2992 33.3133 7.71156 33.3133 8.20378C33.3133 8.696 33.1469 9.11017 32.8141 9.44628C32.4816 9.78211 32.0693 9.95003 31.5771 9.95003H29.0587L29.5958 10.4338C30.9769 11.8216 31.9866 13.3274 32.625 14.9513C33.2633 16.5749 33.5825 18.23 33.5825 19.9167C33.5825 22.5942 32.8876 25.0236 31.4979 27.205C30.1079 29.3867 28.248 31.0503 25.9183 32.1959C25.483 32.4311 25.0351 32.43 24.5746 32.1925C24.1143 31.955 23.808 31.5841 23.6558 31.0796C23.5103 30.6032 23.5289 30.1318 23.7116 29.6654C23.8941 29.1988 24.2065 28.8411 24.6487 28.5925C26.2132 27.7234 27.4612 26.5207 28.3929 24.9846C29.3248 23.4485 29.7908 21.7592 29.7908 19.9167Z"
										fill="#607D8B"
									/>
								</g>
							</svg>
						</a>
						<a 
							href="#">
							onClick={this.openWebDashboard.bind(this)}
							className="item">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_17888_1470"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_17888_1470)">
									<path
										d="M7.87761 18.6113C7.00956 18.6113 6.2665 18.3021 5.64845 17.6838C5.03011 17.0654 4.72095 16.3201 4.72095 15.4479V7.87751C4.72095 7.00751 5.03011 6.26278 5.64845 5.64334C6.2665 5.02389 7.00956 4.71417 7.87761 4.71417H15.4547C16.3228 4.71417 17.0658 5.02389 17.6839 5.64334C18.3022 6.26278 18.6114 7.00751 18.6114 7.87751V15.4479C18.6114 16.3201 18.3022 17.0654 17.6839 17.6838C17.0658 18.3021 16.3228 18.6113 15.4547 18.6113H7.87761ZM7.87761 35.2792C7.00956 35.2792 6.2665 34.97 5.64845 34.3517C5.03011 33.7336 4.72095 32.9906 4.72095 32.1225V24.5454C4.72095 23.6774 5.03011 22.9343 5.64845 22.3163C6.2665 21.6979 7.00956 21.3888 7.87761 21.3888H15.4547C16.3228 21.3888 17.0658 21.6979 17.6839 22.3163C18.3022 22.9343 18.6114 23.6774 18.6114 24.5454V32.1225C18.6114 32.9906 18.3022 33.7336 17.6839 34.3517C17.0658 34.97 16.3228 35.2792 15.4547 35.2792H7.87761ZM24.5522 18.6113C23.68 18.6113 22.9347 18.3021 22.3164 17.6838C21.698 17.0654 21.3889 16.3201 21.3889 15.4479V7.87751C21.3889 7.00751 21.698 6.26278 22.3164 5.64334C22.9347 5.02389 23.68 4.71417 24.5522 4.71417H32.1226C32.9926 4.71417 33.7373 5.02389 34.3568 5.64334C34.9762 6.26278 35.286 7.00751 35.286 7.87751V15.4479C35.286 16.3201 34.9762 17.0654 34.3568 17.6838C33.7373 18.3021 32.9926 18.6113 32.1226 18.6113H24.5522ZM24.5522 35.2792C23.68 35.2792 22.9347 34.97 22.3164 34.3517C21.698 33.7336 21.3889 32.9906 21.3889 32.1225V24.5454C21.3889 23.6774 21.698 22.9343 22.3164 22.3163C22.9347 21.6979 23.68 21.3888 24.5522 21.3888H32.1226C32.9926 21.3888 33.7373 21.6979 34.3568 22.3163C34.9762 22.9343 35.286 23.6774 35.286 24.5454V32.1225C35.286 32.9906 34.9762 33.7336 34.3568 34.3517C33.7373 34.97 32.9926 35.2792 32.1226 35.2792H24.5522ZM7.87761 15.4479H15.4547V7.87751H7.87761V15.4479ZM24.5522 15.4479H32.1226V7.87751H24.5522V15.4479ZM24.5522 32.1225H32.1226V24.5454H24.5522V32.1225ZM7.87761 32.1225H15.4547V24.5454H7.87761V32.1225Z"
										fill="#455A64"
									/>
								</g>
							</svg>
							<span>{locales.DASHBOARD}</span>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_17888_1606"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_17888_1606)">
									<path
										d="M7.87737 35.2792C7.01626 35.2792 6.27487 34.9683 5.6532 34.3467C5.03154 33.725 4.7207 32.9836 4.7207 32.1225V7.87751C4.7207 7.01473 5.03154 6.27181 5.6532 5.64876C6.27487 5.0257 7.01626 4.71417 7.87737 4.71417H17.8382C18.2826 4.71417 18.6568 4.86792 18.9607 5.17542C19.2646 5.48292 19.4165 5.85931 19.4165 6.30459C19.4165 6.75014 19.2646 7.12362 18.9607 7.42501C18.6568 7.72667 18.2826 7.87751 17.8382 7.87751H7.87737V32.1225H32.1224V22.1617C32.1224 21.7172 32.2747 21.3431 32.5795 21.0392C32.8845 20.7353 33.2596 20.5833 33.7049 20.5833C34.1504 20.5833 34.5253 20.7353 34.8295 21.0392C35.1336 21.3431 35.2857 21.7172 35.2857 22.1617V32.1225C35.2857 32.9836 34.9742 33.725 34.3511 34.3467C33.7281 34.9683 32.9852 35.2792 32.1224 35.2792H7.87737ZM32.1224 10.1054L17.3574 24.8771C17.0476 25.1832 16.6807 25.33 16.2565 25.3175C15.8321 25.305 15.4668 25.1456 15.1607 24.8392C14.8543 24.5331 14.7011 24.1664 14.7011 23.7392C14.7011 23.312 14.8543 22.9453 15.1607 22.6392L29.9224 7.87751H23.7724C23.3279 7.87751 22.9538 7.72515 22.6499 7.42042C22.3463 7.11542 22.1945 6.74028 22.1945 6.29501C22.1945 5.84945 22.3463 5.47459 22.6499 5.17042C22.9538 4.86626 23.3279 4.71417 23.7724 4.71417H33.7007C34.1446 4.71417 34.5197 4.86737 34.8261 5.17375C35.1325 5.48014 35.2857 5.85528 35.2857 6.29917V16.2275C35.2857 16.672 35.132 17.0461 34.8245 17.35C34.517 17.6536 34.1406 17.8054 33.6953 17.8054C33.2497 17.8054 32.8763 17.6536 32.5749 17.35C32.2732 17.0461 32.1224 16.672 32.1224 16.2275V10.1054Z"
										fill="#455A64"
									/>
								</g>
							</svg>
						</a>
						<a 							
							href="#"
							className="item">
							onClick={this.openShareFeedbackPage.bind(this)}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_18947_45520"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_18947_45520)">
									<path
										d="M11.5117 23.3996H14.6413C14.843 23.3996 15.0375 23.3622 15.225 23.2875C15.4125 23.2128 15.5877 23.0936 15.7505 22.93L23.3655 15.3012C23.6324 15.0315 23.831 14.7271 23.9613 14.3879C24.0916 14.0487 24.1567 13.7147 24.1567 13.3858C24.1567 13.0572 24.0943 12.7314 23.9696 12.4083C23.8449 12.0853 23.6543 11.7887 23.3979 11.5187L21.8659 9.9679C21.5923 9.70596 21.2927 9.5086 20.9671 9.37582C20.6416 9.24304 20.3011 9.17665 19.9459 9.17665C19.6203 9.17665 19.2949 9.23832 18.9696 9.36165C18.6441 9.48526 18.3466 9.67776 18.0771 9.93915L10.4067 17.5829C10.2431 17.7485 10.1234 17.9243 10.0475 18.1104C9.9717 18.2965 9.93378 18.4904 9.93378 18.6921V21.8217C9.93378 22.2661 10.0856 22.6403 10.3892 22.9442C10.6931 23.2478 11.0673 23.3996 11.5117 23.3996ZM12.5996 20.7337V19.1504L16.5367 15.2508L17.3325 16.0008L18.0825 16.7967L14.183 20.7337H12.5996ZM17.3325 16.0008L18.0825 16.7967L16.5367 15.2508L17.3325 16.0008ZM18.4675 23.3996H28.6755C29.0705 23.3996 29.401 23.2661 29.6671 22.9992C29.9332 22.7319 30.0663 22.4008 30.0663 22.0058C30.0663 21.6111 29.9332 21.2818 29.6671 21.0179C29.401 20.754 29.0705 20.6221 28.6755 20.6221H21.2455L18.4675 23.3996ZM9.72087 30.2792L5.74753 34.2525C5.24809 34.7519 4.67434 34.8661 4.02628 34.595C3.37823 34.3242 3.0542 33.8403 3.0542 33.1433V6.21082C3.0542 5.34804 3.36503 4.60512 3.9867 3.98207C4.60837 3.35901 5.34975 3.04749 6.21087 3.04749H33.7892C34.652 3.04749 35.3949 3.35901 36.018 3.98207C36.641 4.60512 36.9525 5.34804 36.9525 6.21082V27.1225C36.9525 27.9836 36.641 28.725 36.018 29.3467C35.3949 29.9683 34.652 30.2792 33.7892 30.2792H9.72087ZM8.5267 27.1225H33.7892V6.21082H6.21087V29.5946L8.5267 27.1225Z"
										fill="#607D8B"
									/>
								</g>
							</svg>
							<span>{locales.SHARE_FEEDBACK}</span>
						</a>
						<a 
							href="#">
							className="item" 
							onClick={this.handleLogoutClick.bind(this)}
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_17888_1605"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_17888_1605)">
									<path
										d="M33.3625 21.5783H15.0946C14.6501 21.5783 14.276 21.4258 13.9721 21.1208C13.6682 20.8161 13.5162 20.4408 13.5162 19.995C13.5162 19.5492 13.6682 19.1756 13.9721 18.8742C14.276 18.5725 14.6501 18.4217 15.0946 18.4217H33.3625L31.1146 16.1738C30.8057 15.8632 30.6519 15.4961 30.6533 15.0725C30.6544 14.6486 30.8078 14.2789 31.1133 13.9633C31.4339 13.6547 31.8124 13.4986 32.2487 13.495C32.6849 13.4914 33.0574 13.6463 33.3662 13.9596L38.3262 18.885C38.6415 19.2019 38.7992 19.574 38.7992 20.0013C38.7992 20.4285 38.6415 20.7997 38.3262 21.115L33.3662 26.0683C33.0612 26.3814 32.6949 26.5332 32.2671 26.5238C31.8393 26.5143 31.464 26.3513 31.1412 26.0346C30.8415 25.7246 30.6896 25.3517 30.6854 24.9158C30.6812 24.4797 30.8335 24.1074 31.1421 23.7988L33.3625 21.5783ZM23.5246 14.0592V7.87751H7.87749V32.1225H23.5246V25.9342C23.5246 25.4897 23.6769 25.1156 23.9817 24.8117C24.2864 24.5078 24.6617 24.3558 25.1075 24.3558C25.5533 24.3558 25.9269 24.5078 26.2283 24.8117C26.53 25.1156 26.6808 25.4897 26.6808 25.9342V32.1225C26.6808 32.9975 26.3724 33.7424 25.7554 34.3571C25.1382 34.9718 24.3946 35.2792 23.5246 35.2792H7.87749C7.00249 35.2792 6.25763 34.9718 5.64291 34.3571C5.02819 33.7424 4.72083 32.9975 4.72083 32.1225V7.87751C4.72083 7.00084 5.02819 6.25445 5.64291 5.63834C6.25763 5.02223 7.00249 4.71417 7.87749 4.71417H23.5246C24.3946 4.71417 25.1382 5.02223 25.7554 5.63834C26.3724 6.25445 26.6808 7.00084 26.6808 7.87751V14.0592C26.6808 14.5081 26.5285 14.8845 26.2237 15.1883C25.919 15.4922 25.5437 15.6442 25.0979 15.6442C24.6521 15.6442 24.2783 15.4922 23.9767 15.1883C23.6753 14.8845 23.5246 14.5081 23.5246 14.0592Z"
										fill="#455A64"
									/>
								</g>
							</svg>
							<span>{locales.LOG_OUT}</span>
						</a> */}
						<div className="dropdown-header">{locales.ENTRY_MODE}</div>
						<a
							id="manual"
							className={
								JSON.parse(this.props.disableManual) ||
								this.props.manualModeDisabled ||
								this.props.isTrackingDisabled
									? 'dropdown-item disable-manual'
									: this.props.mode === 'manual'
										? 'dropdown-item active hover'
										: 'dropdown-item hover'
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
									? 'dropdown-item active hover'
									: 'dropdown-item hover'
							}
							href="#"
							onClick={this.changeModeToTimer.bind(this)}>
							<span className="menu-timer-img"></span>
							<span>{locales.TRACKER__TIME_TRACKER__ENTRY__TRACK__TIMER_N}</span>
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
							href="#"
							className="item item-with-two-children hover"
							onClick={this.openSettings.bind(this)}>
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="none">
									<mask
										id="mask0_17888_1481"
										style={{ maskType: 'alpha' }}
										maskUnits="userSpaceOnUse"
										x="0"
										y="0"
										width="40"
										height="40">
										<rect width="40" height="40" fill="#D9D9D9" />
									</mask>
									<g mask="url(#mask0_17888_1481)">
										<path
											d="M17.5521 36.9458C17.0141 36.9458 16.5435 36.773 16.1404 36.4275C15.7374 36.0819 15.4989 35.6447 15.425 35.1158L14.8834 31.5783C14.4553 31.4222 14.0107 31.2105 13.5496 30.9433C13.0885 30.6764 12.6767 30.3998 12.3142 30.1137L9.07378 31.5862C8.561 31.8057 8.04489 31.8304 7.52545 31.6604C7.006 31.4904 6.60295 31.1642 6.31628 30.6817L3.89628 26.365C3.60517 25.8936 3.52142 25.3951 3.64503 24.8696C3.76864 24.3443 4.04989 23.9129 4.48878 23.5754L7.43711 21.3812C7.39767 21.1718 7.37322 20.9415 7.36378 20.6904C7.35461 20.4396 7.35003 20.2094 7.35003 20C7.35003 19.7905 7.35461 19.5604 7.36378 19.3096C7.37322 19.0585 7.39767 18.8282 7.43711 18.6187L4.48878 16.4346C4.0435 16.0971 3.76058 15.6657 3.64003 15.1404C3.51975 14.6148 3.60517 14.113 3.89628 13.635L6.31628 9.32165C6.60295 8.85026 7.00433 8.52679 7.52045 8.35123C8.03656 8.17568 8.55114 8.19762 9.0642 8.41707L12.3338 9.88957C12.6921 9.6079 13.1014 9.33512 13.5617 9.07124C14.0217 8.80762 14.4623 8.60485 14.8834 8.4629L15.425 4.89415C15.4989 4.3586 15.7374 3.91693 16.1404 3.56915C16.5435 3.22137 17.0141 3.04749 17.5521 3.04749H22.4479C22.986 3.04749 23.4566 3.22137 23.8596 3.56915C24.2627 3.91693 24.5011 4.3586 24.575 4.89415L25.1167 8.43499C25.5448 8.59554 25.9928 8.80304 26.4609 9.05749C26.9289 9.31193 27.3373 9.58929 27.6859 9.88957L30.9263 8.41707C31.4391 8.19762 31.9506 8.17568 32.4609 8.35123C32.9711 8.52679 33.3696 8.85026 33.6563 9.32165L36.1104 13.635C36.3971 14.113 36.4803 14.6194 36.36 15.1542C36.2395 15.6889 35.9566 16.1157 35.5113 16.4346L32.5529 18.5633C32.5927 18.7911 32.6182 19.0305 32.6296 19.2817C32.641 19.5328 32.6467 19.7722 32.6467 20C32.6467 20.2278 32.6404 20.4626 32.6279 20.7046C32.6154 20.9462 32.5857 21.181 32.5388 21.4087L35.4975 23.5654C35.9428 23.8843 36.2256 24.3111 36.3459 24.8458C36.4664 25.3805 36.3834 25.8869 36.0967 26.365L33.6563 30.6817C33.3696 31.1575 32.9681 31.4821 32.4517 31.6554C31.9356 31.8287 31.4211 31.8057 30.9084 31.5862L27.6729 30.1137C27.3102 30.3998 26.9034 30.68 26.4525 30.9542C26.0014 31.2283 25.5561 31.4364 25.1167 31.5783L24.575 35.1158C24.5011 35.6447 24.2627 36.0819 23.8596 36.4275C23.4566 36.773 22.986 36.9458 22.4479 36.9458H17.5521ZM18.3121 33.7892H21.6642L22.2575 29.2192C23.1623 28.9969 24.0166 28.6561 24.8204 28.1967C25.6243 27.7372 26.3503 27.1723 26.9984 26.5021L31.3146 28.3492L32.8679 25.5508L29.0854 22.7517C29.2057 22.2983 29.3006 21.8437 29.37 21.3879C29.4392 20.9323 29.4738 20.4697 29.4738 20C29.4738 19.5303 29.4438 19.0676 29.3838 18.6121C29.3238 18.1562 29.2243 17.7017 29.0854 17.2483L32.8813 14.4492L31.3146 11.6508L27.0084 13.5117C26.3789 12.8017 25.6657 12.2079 24.8688 11.7304C24.0721 11.2529 23.2017 10.9342 22.2575 10.7742L21.6879 6.21082H18.3225L17.7525 10.7708C16.8203 10.9678 15.9506 11.3004 15.1434 11.7687C14.3361 12.2371 13.6145 12.8135 12.9784 13.4979L8.68211 11.6508L7.11878 14.4492L10.8913 17.2246C10.771 17.6871 10.6761 18.1455 10.6067 18.6C10.5375 19.0544 10.5029 19.5211 10.5029 20C10.5029 20.4697 10.5375 20.9333 10.6067 21.3908C10.6761 21.8486 10.771 22.3067 10.8913 22.765L7.11878 25.5508L8.68211 28.3492L12.9784 26.4917C13.6331 27.1622 14.3646 27.7305 15.1729 28.1967C15.9813 28.6628 16.8411 29.0069 17.7525 29.2292L18.3121 33.7892ZM20.0046 25.5554C21.5416 25.5554 22.8517 25.0137 23.935 23.9304C25.0184 22.8471 25.56 21.5369 25.56 20C25.56 18.463 25.0184 17.1529 23.935 16.0696C22.8517 14.9862 21.5416 14.4446 20.0046 14.4446C18.4604 14.4446 17.1485 14.9862 16.0688 16.0696C14.9891 17.1529 14.4492 18.463 14.4492 20C14.4492 21.5369 14.9891 22.8471 16.0688 23.9304C17.1485 25.0137 18.4604 25.5554 20.0046 25.5554Z"
											fill={iconColor}
										/>
									</g>
								</svg>
							</div>

							<span
								className={
									this.state.isOffline || this.props.isTrackingDisabled
										? 'disable-manual'
										: ''
								}>
								{locales.SETTINGS}
							</span>
						</a>
						<a href="#" className="item item-with-two-children">
							<span onClick={this.openUrlPermissions.bind(this)} className="hover">
								<div>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="40"
										height="40"
										viewBox="0 0 40 40"
										fill="none">
										<mask
											id="mask0_17888_1669"
											style={{ maskType: 'alpha' }}
											maskUnits="userSpaceOnUse"
											x="0"
											y="0"
											width="40"
											height="40">
											<rect width="40" height="40" fill="#D9D9D9" />
										</mask>
										<g mask="url(#mask0_17888_1669)">
											<path
												d="M14.9305 35.2792H7.77803C6.95109 35.2792 6.23484 34.9764 5.62928 34.3708C5.02373 33.7653 4.72095 33.049 4.72095 32.2221V25.0696C5.91845 24.9813 6.94886 24.5347 7.8122 23.73C8.67581 22.925 9.10761 21.932 9.10761 20.7508C9.10761 19.5697 8.67581 18.5764 7.8122 17.7708C6.94886 16.9656 5.91845 16.5165 4.72095 16.4238V9.27793C4.72095 8.45237 5.02373 7.73543 5.62928 7.1271C6.23484 6.51849 6.95109 6.21418 7.77803 6.21418H14.6743C14.9379 5.05362 15.4878 4.08751 16.3239 3.31585C17.16 2.5439 18.1539 2.15793 19.3055 2.15793C20.4575 2.15793 21.4515 2.5439 22.2876 3.31585C23.1237 4.08751 23.6736 5.05362 23.9372 6.21418H30.7222C31.5478 6.21418 32.2647 6.51849 32.873 7.1271C33.4816 7.73543 33.7859 8.45237 33.7859 9.27793V16.0629C34.9465 16.3265 35.8987 16.8949 36.6426 17.7679C37.3868 18.6413 37.7589 19.6538 37.7589 20.8054C37.7589 21.9574 37.3868 22.9375 36.6426 23.7458C35.8987 24.5542 34.9465 25.0902 33.7859 25.3538V32.2221C33.7859 33.049 33.4816 33.7653 32.873 34.3708C32.2647 34.9764 31.5478 35.2792 30.7222 35.2792H23.5764C23.4791 33.9625 23.0171 32.8818 22.1901 32.0371C21.3629 31.1921 20.3823 30.7696 19.2484 30.7696C18.1146 30.7696 17.1346 31.1922 16.3084 32.0375C15.4826 32.8825 15.0233 33.9631 14.9305 35.2792ZM7.87761 32.1225H12.5897C13.2528 30.4639 14.2308 29.2965 15.5239 28.6204C16.8172 27.9446 18.0593 27.6067 19.2501 27.6067C20.4215 27.6067 21.6559 27.9446 22.9534 28.6204C24.2509 29.2965 25.2398 30.4639 25.9201 32.1225H30.6226V22.3642H33.0414C33.485 22.3642 33.855 22.2158 34.1514 21.9192C34.4478 21.6225 34.5959 21.2518 34.5959 20.8071C34.5959 20.3621 34.4478 19.9914 34.1514 19.695C33.855 19.3983 33.485 19.25 33.0414 19.25H30.6226V9.37751H20.8643V6.87543C20.8643 6.43182 20.7159 6.06182 20.4193 5.76543C20.1226 5.46904 19.7519 5.32085 19.3072 5.32085C18.8622 5.32085 18.4915 5.46904 18.1951 5.76543C17.8984 6.06182 17.7501 6.43182 17.7501 6.87543V9.37751H7.87761V14.0913C9.20289 14.6704 10.2669 15.5604 11.0697 16.7613C11.8725 17.9618 12.2739 19.2939 12.2739 20.7575C12.2739 22.1958 11.8729 23.5193 11.0709 24.7279C10.269 25.9365 9.20456 26.8313 7.87761 27.4121V32.1225Z"
												fill={iconColor}
											/>
										</g>
									</svg>
								</div>
								<span
									className={
										this.state.isOffline || this.props.isTrackingDisabled
											? 'disable-manual'
											: ''
									}>
									{locales.INTEGRATIONS}
								</span>
							</span>
							<div
								className="hover"
								onClick={this.handleIntegrationsRefresh}
								title={locales.REFRESH}>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="currentColor">
									<mask
										id="mask0_18943_44256"
										style={{ maskType: 'alpha' }}
										maskUnits="userSpaceOnUse"
										x="0"
										y="0"
										width="40"
										height="40">
										<rect width="40" height="40" fill="currentColor" />
									</mask>
									<g mask="url(#mask0_18943_44256)">
										<path
											d="M10.2091 20.0834C10.2091 21.2936 10.4403 22.4741 10.9025 23.6246C11.3647 24.7752 12.0826 25.8438 13.0562 26.8304L13.3929 27.1675V25.0696C13.3929 24.5777 13.561 24.1653 13.8971 23.8325C14.2332 23.4998 14.6473 23.3334 15.1396 23.3334C15.6318 23.3334 16.0441 23.4998 16.3766 23.8325C16.7094 24.1653 16.8758 24.5777 16.8758 25.0696V31.6367C16.8758 32.1686 16.6929 32.6177 16.3271 32.9838C15.961 33.3496 15.5119 33.5325 14.98 33.5325H8.4229C7.93067 33.5325 7.51831 33.3645 7.18581 33.0284C6.85304 32.6925 6.68665 32.2785 6.68665 31.7863C6.68665 31.2941 6.8547 30.8816 7.19081 30.5488C7.52665 30.2163 7.94067 30.05 8.4329 30.05H10.9412L10.4041 29.5663C8.95304 28.2485 7.92581 26.7602 7.32248 25.1013C6.71915 23.4427 6.41748 21.77 6.41748 20.0834C6.41748 17.4059 7.11234 14.9764 8.50206 12.795C9.89206 10.6134 11.7519 8.94975 14.0816 7.8042C14.5169 7.56892 14.9648 7.57003 15.4254 7.80753C15.8857 8.04503 16.1919 8.416 16.3441 8.92045C16.4897 9.39684 16.4711 9.86823 16.2883 10.3346C16.1058 10.8013 15.7935 11.1589 15.3512 11.4075C13.7868 12.2767 12.5387 13.4793 11.6071 15.0154C10.6751 16.5516 10.2091 18.2409 10.2091 20.0834ZM29.7908 19.9167C29.7908 18.7064 29.5597 17.526 29.0975 16.3754C28.6353 15.2249 27.9173 14.1563 26.9437 13.1696L26.6071 12.8325V14.9304C26.6071 15.4224 26.4407 15.8348 26.1079 16.1675C25.7751 16.5003 25.3626 16.6667 24.8704 16.6667C24.3782 16.6667 23.9641 16.4986 23.6283 16.1625C23.2922 15.8264 23.1241 15.4124 23.1241 14.9204V8.36336C23.1241 7.83142 23.3071 7.38239 23.6729 7.01628C24.039 6.65045 24.488 6.46753 25.02 6.46753H31.5771C32.0693 6.46753 32.4816 6.63392 32.8141 6.9667C33.1469 7.2992 33.3133 7.71156 33.3133 8.20378C33.3133 8.696 33.1469 9.11017 32.8141 9.44628C32.4816 9.78211 32.0693 9.95003 31.5771 9.95003H29.0587L29.5958 10.4338C30.9769 11.8216 31.9866 13.3274 32.625 14.9513C33.2633 16.5749 33.5825 18.23 33.5825 19.9167C33.5825 22.5942 32.8876 25.0236 31.4979 27.205C30.1079 29.3867 28.248 31.0503 25.9183 32.1959C25.483 32.4311 25.0351 32.43 24.5746 32.1925C24.1143 31.955 23.808 31.5841 23.6558 31.0796C23.5103 30.6032 23.5289 30.1318 23.7116 29.6654C23.8941 29.1988 24.2065 28.8411 24.6487 28.5925C26.2132 27.7234 27.4612 26.5207 28.3929 24.9846C29.3248 23.4485 29.7908 21.7592 29.7908 19.9167Z"
											fill="currentColor"
										/>
									</g>
								</svg>
							</div>
						</a>
						<a
							href="#"
							onClick={this.openWebDashboard.bind(this)}
							className="item item-with-three-children hover">
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="none">
									<mask
										id="mask0_17888_1470"
										style={{ maskType: 'alpha' }}
										maskUnits="userSpaceOnUse"
										x="0"
										y="0"
										width="40"
										height="40">
										<rect width="40" height="40" fill="#D9D9D9" />
									</mask>
									<g mask="url(#mask0_17888_1470)">
										<path
											d="M7.87761 18.6113C7.00956 18.6113 6.2665 18.3021 5.64845 17.6838C5.03011 17.0654 4.72095 16.3201 4.72095 15.4479V7.87751C4.72095 7.00751 5.03011 6.26278 5.64845 5.64334C6.2665 5.02389 7.00956 4.71417 7.87761 4.71417H15.4547C16.3228 4.71417 17.0658 5.02389 17.6839 5.64334C18.3022 6.26278 18.6114 7.00751 18.6114 7.87751V15.4479C18.6114 16.3201 18.3022 17.0654 17.6839 17.6838C17.0658 18.3021 16.3228 18.6113 15.4547 18.6113H7.87761ZM7.87761 35.2792C7.00956 35.2792 6.2665 34.97 5.64845 34.3517C5.03011 33.7336 4.72095 32.9906 4.72095 32.1225V24.5454C4.72095 23.6774 5.03011 22.9343 5.64845 22.3163C6.2665 21.6979 7.00956 21.3888 7.87761 21.3888H15.4547C16.3228 21.3888 17.0658 21.6979 17.6839 22.3163C18.3022 22.9343 18.6114 23.6774 18.6114 24.5454V32.1225C18.6114 32.9906 18.3022 33.7336 17.6839 34.3517C17.0658 34.97 16.3228 35.2792 15.4547 35.2792H7.87761ZM24.5522 18.6113C23.68 18.6113 22.9347 18.3021 22.3164 17.6838C21.698 17.0654 21.3889 16.3201 21.3889 15.4479V7.87751C21.3889 7.00751 21.698 6.26278 22.3164 5.64334C22.9347 5.02389 23.68 4.71417 24.5522 4.71417H32.1226C32.9926 4.71417 33.7373 5.02389 34.3568 5.64334C34.9762 6.26278 35.286 7.00751 35.286 7.87751V15.4479C35.286 16.3201 34.9762 17.0654 34.3568 17.6838C33.7373 18.3021 32.9926 18.6113 32.1226 18.6113H24.5522ZM24.5522 35.2792C23.68 35.2792 22.9347 34.97 22.3164 34.3517C21.698 33.7336 21.3889 32.9906 21.3889 32.1225V24.5454C21.3889 23.6774 21.698 22.9343 22.3164 22.3163C22.9347 21.6979 23.68 21.3888 24.5522 21.3888H32.1226C32.9926 21.3888 33.7373 21.6979 34.3568 22.3163C34.9762 22.9343 35.286 23.6774 35.286 24.5454V32.1225C35.286 32.9906 34.9762 33.7336 34.3568 34.3517C33.7373 34.97 32.9926 35.2792 32.1226 35.2792H24.5522ZM7.87761 15.4479H15.4547V7.87751H7.87761V15.4479ZM24.5522 15.4479H32.1226V7.87751H24.5522V15.4479ZM24.5522 32.1225H32.1226V24.5454H24.5522V32.1225ZM7.87761 32.1225H15.4547V24.5454H7.87761V32.1225Z"
											fill={iconColor}
										/>
									</g>
								</svg>
							</div>

							<span
								className={
									this.state.isOffline || this.props.isTrackingDisabled
										? 'disable-manual'
										: ''
								}>
								{locales.DASHBOARD}
							</span>
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="none">
									<mask
										id="mask0_17888_1606"
										style={{ maskType: 'alpha' }}
										maskUnits="userSpaceOnUse"
										x="0"
										y="0"
										width="40"
										height="40">
										<rect width="40" height="40" fill="#D9D9D9" />
									</mask>
									<g mask="url(#mask0_17888_1606)">
										<path
											d="M7.87737 35.2792C7.01626 35.2792 6.27487 34.9683 5.6532 34.3467C5.03154 33.725 4.7207 32.9836 4.7207 32.1225V7.87751C4.7207 7.01473 5.03154 6.27181 5.6532 5.64876C6.27487 5.0257 7.01626 4.71417 7.87737 4.71417H17.8382C18.2826 4.71417 18.6568 4.86792 18.9607 5.17542C19.2646 5.48292 19.4165 5.85931 19.4165 6.30459C19.4165 6.75014 19.2646 7.12362 18.9607 7.42501C18.6568 7.72667 18.2826 7.87751 17.8382 7.87751H7.87737V32.1225H32.1224V22.1617C32.1224 21.7172 32.2747 21.3431 32.5795 21.0392C32.8845 20.7353 33.2596 20.5833 33.7049 20.5833C34.1504 20.5833 34.5253 20.7353 34.8295 21.0392C35.1336 21.3431 35.2857 21.7172 35.2857 22.1617V32.1225C35.2857 32.9836 34.9742 33.725 34.3511 34.3467C33.7281 34.9683 32.9852 35.2792 32.1224 35.2792H7.87737ZM32.1224 10.1054L17.3574 24.8771C17.0476 25.1832 16.6807 25.33 16.2565 25.3175C15.8321 25.305 15.4668 25.1456 15.1607 24.8392C14.8543 24.5331 14.7011 24.1664 14.7011 23.7392C14.7011 23.312 14.8543 22.9453 15.1607 22.6392L29.9224 7.87751H23.7724C23.3279 7.87751 22.9538 7.72515 22.6499 7.42042C22.3463 7.11542 22.1945 6.74028 22.1945 6.29501C22.1945 5.84945 22.3463 5.47459 22.6499 5.17042C22.9538 4.86626 23.3279 4.71417 23.7724 4.71417H33.7007C34.1446 4.71417 34.5197 4.86737 34.8261 5.17375C35.1325 5.48014 35.2857 5.85528 35.2857 6.29917V16.2275C35.2857 16.672 35.132 17.0461 34.8245 17.35C34.517 17.6536 34.1406 17.8054 33.6953 17.8054C33.2497 17.8054 32.8763 17.6536 32.5749 17.35C32.2732 17.0461 32.1224 16.672 32.1224 16.2275V10.1054Z"
											fill={iconColor}
										/>
									</g>
								</svg>
							</div>
						</a>
						<a
							href="#"
							className="item item-with-two-children hover"
							onClick={this.openShareFeedbackPage.bind(this)}>
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="none">
									<mask
										id="mask0_18947_45520"
										style={{ maskType: 'alpha' }}
										maskUnits="userSpaceOnUse"
										x="0"
										y="0"
										width="40"
										height="40">
										<rect width="40" height="40" fill="#D9D9D9" />
									</mask>
									<g mask="url(#mask0_18947_45520)">
										<path
											d="M11.5117 23.3996H14.6413C14.843 23.3996 15.0375 23.3622 15.225 23.2875C15.4125 23.2128 15.5877 23.0936 15.7505 22.93L23.3655 15.3012C23.6324 15.0315 23.831 14.7271 23.9613 14.3879C24.0916 14.0487 24.1567 13.7147 24.1567 13.3858C24.1567 13.0572 24.0943 12.7314 23.9696 12.4083C23.8449 12.0853 23.6543 11.7887 23.3979 11.5187L21.8659 9.9679C21.5923 9.70596 21.2927 9.5086 20.9671 9.37582C20.6416 9.24304 20.3011 9.17665 19.9459 9.17665C19.6203 9.17665 19.2949 9.23832 18.9696 9.36165C18.6441 9.48526 18.3466 9.67776 18.0771 9.93915L10.4067 17.5829C10.2431 17.7485 10.1234 17.9243 10.0475 18.1104C9.9717 18.2965 9.93378 18.4904 9.93378 18.6921V21.8217C9.93378 22.2661 10.0856 22.6403 10.3892 22.9442C10.6931 23.2478 11.0673 23.3996 11.5117 23.3996ZM12.5996 20.7337V19.1504L16.5367 15.2508L17.3325 16.0008L18.0825 16.7967L14.183 20.7337H12.5996ZM17.3325 16.0008L18.0825 16.7967L16.5367 15.2508L17.3325 16.0008ZM18.4675 23.3996H28.6755C29.0705 23.3996 29.401 23.2661 29.6671 22.9992C29.9332 22.7319 30.0663 22.4008 30.0663 22.0058C30.0663 21.6111 29.9332 21.2818 29.6671 21.0179C29.401 20.754 29.0705 20.6221 28.6755 20.6221H21.2455L18.4675 23.3996ZM9.72087 30.2792L5.74753 34.2525C5.24809 34.7519 4.67434 34.8661 4.02628 34.595C3.37823 34.3242 3.0542 33.8403 3.0542 33.1433V6.21082C3.0542 5.34804 3.36503 4.60512 3.9867 3.98207C4.60837 3.35901 5.34975 3.04749 6.21087 3.04749H33.7892C34.652 3.04749 35.3949 3.35901 36.018 3.98207C36.641 4.60512 36.9525 5.34804 36.9525 6.21082V27.1225C36.9525 27.9836 36.641 28.725 36.018 29.3467C35.3949 29.9683 34.652 30.2792 33.7892 30.2792H9.72087ZM8.5267 27.1225H33.7892V6.21082H6.21087V29.5946L8.5267 27.1225Z"
											fill={iconColor}
										/>
									</g>
								</svg>
							</div>
							<span className={this.state.isOffline ? 'disable-manual' : ''}>
								{locales.SHARE_FEEDBACK}
							</span>
						</a>
						<a
							href="#"
							className="item item-with-two-children hover"
							onClick={this.handleLogoutClick.bind(this)}>
							<div>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="40"
									height="40"
									viewBox="0 0 40 40"
									fill="none">
									<mask
										id="mask0_17888_1605"
										style={{ maskType: 'alpha' }}
										maskUnits="userSpaceOnUse"
										x="0"
										y="0"
										width="40"
										height="40">
										<rect width="40" height="40" fill="#D9D9D9" />
									</mask>
									<g mask="url(#mask0_17888_1605)">
										<path
											d="M33.3625 21.5783H15.0946C14.6501 21.5783 14.276 21.4258 13.9721 21.1208C13.6682 20.8161 13.5162 20.4408 13.5162 19.995C13.5162 19.5492 13.6682 19.1756 13.9721 18.8742C14.276 18.5725 14.6501 18.4217 15.0946 18.4217H33.3625L31.1146 16.1738C30.8057 15.8632 30.6519 15.4961 30.6533 15.0725C30.6544 14.6486 30.8078 14.2789 31.1133 13.9633C31.4339 13.6547 31.8124 13.4986 32.2487 13.495C32.6849 13.4914 33.0574 13.6463 33.3662 13.9596L38.3262 18.885C38.6415 19.2019 38.7992 19.574 38.7992 20.0013C38.7992 20.4285 38.6415 20.7997 38.3262 21.115L33.3662 26.0683C33.0612 26.3814 32.6949 26.5332 32.2671 26.5238C31.8393 26.5143 31.464 26.3513 31.1412 26.0346C30.8415 25.7246 30.6896 25.3517 30.6854 24.9158C30.6812 24.4797 30.8335 24.1074 31.1421 23.7988L33.3625 21.5783ZM23.5246 14.0592V7.87751H7.87749V32.1225H23.5246V25.9342C23.5246 25.4897 23.6769 25.1156 23.9817 24.8117C24.2864 24.5078 24.6617 24.3558 25.1075 24.3558C25.5533 24.3558 25.9269 24.5078 26.2283 24.8117C26.53 25.1156 26.6808 25.4897 26.6808 25.9342V32.1225C26.6808 32.9975 26.3724 33.7424 25.7554 34.3571C25.1382 34.9718 24.3946 35.2792 23.5246 35.2792H7.87749C7.00249 35.2792 6.25763 34.9718 5.64291 34.3571C5.02819 33.7424 4.72083 32.9975 4.72083 32.1225V7.87751C4.72083 7.00084 5.02819 6.25445 5.64291 5.63834C6.25763 5.02223 7.00249 4.71417 7.87749 4.71417H23.5246C24.3946 4.71417 25.1382 5.02223 25.7554 5.63834C26.3724 6.25445 26.6808 7.00084 26.6808 7.87751V14.0592C26.6808 14.5081 26.5285 14.8845 26.2237 15.1883C25.919 15.4922 25.5437 15.6442 25.0979 15.6442C24.6521 15.6442 24.2783 15.4922 23.9767 15.1883C23.6753 14.8845 23.5246 14.5081 23.5246 14.0592Z"
											fill={iconColor}
										/>
									</g>
								</svg>
							</div>

							<span className={this.state.isOffline ? 'disable-manual' : ''}>
								{locales.LOG_OUT}
							</span>
						</a>
						{/* <a
							onClick={this.openSettings.bind(this)}
							className="dropdown-item item-horizontal subitem-container"
							href="#">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="40"
								height="40"
								viewBox="0 0 40 40"
								fill="none">
								<mask
									id="mask0_17888_1481"
									style={{ maskType: 'alpha' }}
									maskUnits="userSpaceOnUse"
									x="0"
									y="0"
									width="40"
									height="40">
									<rect width="40" height="40" fill="#D9D9D9" />
								</mask>
								<g mask="url(#mask0_17888_1481)">
									<path
										d="M17.5521 36.9458C17.0141 36.9458 16.5435 36.773 16.1404 36.4275C15.7374 36.0819 15.4989 35.6447 15.425 35.1158L14.8834 31.5783C14.4553 31.4222 14.0107 31.2105 13.5496 30.9433C13.0885 30.6764 12.6767 30.3998 12.3142 30.1137L9.07378 31.5862C8.561 31.8057 8.04489 31.8304 7.52545 31.6604C7.006 31.4904 6.60295 31.1642 6.31628 30.6817L3.89628 26.365C3.60517 25.8936 3.52142 25.3951 3.64503 24.8696C3.76864 24.3443 4.04989 23.9129 4.48878 23.5754L7.43711 21.3812C7.39767 21.1718 7.37322 20.9415 7.36378 20.6904C7.35461 20.4396 7.35003 20.2094 7.35003 20C7.35003 19.7905 7.35461 19.5604 7.36378 19.3096C7.37322 19.0585 7.39767 18.8282 7.43711 18.6187L4.48878 16.4346C4.0435 16.0971 3.76058 15.6657 3.64003 15.1404C3.51975 14.6148 3.60517 14.113 3.89628 13.635L6.31628 9.32165C6.60295 8.85026 7.00433 8.52679 7.52045 8.35123C8.03656 8.17568 8.55114 8.19762 9.0642 8.41707L12.3338 9.88957C12.6921 9.6079 13.1014 9.33512 13.5617 9.07124C14.0217 8.80762 14.4623 8.60485 14.8834 8.4629L15.425 4.89415C15.4989 4.3586 15.7374 3.91693 16.1404 3.56915C16.5435 3.22137 17.0141 3.04749 17.5521 3.04749H22.4479C22.986 3.04749 23.4566 3.22137 23.8596 3.56915C24.2627 3.91693 24.5011 4.3586 24.575 4.89415L25.1167 8.43499C25.5448 8.59554 25.9928 8.80304 26.4609 9.05749C26.9289 9.31193 27.3373 9.58929 27.6859 9.88957L30.9263 8.41707C31.4391 8.19762 31.9506 8.17568 32.4609 8.35123C32.9711 8.52679 33.3696 8.85026 33.6563 9.32165L36.1104 13.635C36.3971 14.113 36.4803 14.6194 36.36 15.1542C36.2395 15.6889 35.9566 16.1157 35.5113 16.4346L32.5529 18.5633C32.5927 18.7911 32.6182 19.0305 32.6296 19.2817C32.641 19.5328 32.6467 19.7722 32.6467 20C32.6467 20.2278 32.6404 20.4626 32.6279 20.7046C32.6154 20.9462 32.5857 21.181 32.5388 21.4087L35.4975 23.5654C35.9428 23.8843 36.2256 24.3111 36.3459 24.8458C36.4664 25.3805 36.3834 25.8869 36.0967 26.365L33.6563 30.6817C33.3696 31.1575 32.9681 31.4821 32.4517 31.6554C31.9356 31.8287 31.4211 31.8057 30.9084 31.5862L27.6729 30.1137C27.3102 30.3998 26.9034 30.68 26.4525 30.9542C26.0014 31.2283 25.5561 31.4364 25.1167 31.5783L24.575 35.1158C24.5011 35.6447 24.2627 36.0819 23.8596 36.4275C23.4566 36.773 22.986 36.9458 22.4479 36.9458H17.5521ZM18.3121 33.7892H21.6642L22.2575 29.2192C23.1623 28.9969 24.0166 28.6561 24.8204 28.1967C25.6243 27.7372 26.3503 27.1723 26.9984 26.5021L31.3146 28.3492L32.8679 25.5508L29.0854 22.7517C29.2057 22.2983 29.3006 21.8437 29.37 21.3879C29.4392 20.9323 29.4738 20.4697 29.4738 20C29.4738 19.5303 29.4438 19.0676 29.3838 18.6121C29.3238 18.1562 29.2243 17.7017 29.0854 17.2483L32.8813 14.4492L31.3146 11.6508L27.0084 13.5117C26.3789 12.8017 25.6657 12.2079 24.8688 11.7304C24.0721 11.2529 23.2017 10.9342 22.2575 10.7742L21.6879 6.21082H18.3225L17.7525 10.7708C16.8203 10.9678 15.9506 11.3004 15.1434 11.7687C14.3361 12.2371 13.6145 12.8135 12.9784 13.4979L8.68211 11.6508L7.11878 14.4492L10.8913 17.2246C10.771 17.6871 10.6761 18.1455 10.6067 18.6C10.5375 19.0544 10.5029 19.5211 10.5029 20C10.5029 20.4697 10.5375 20.9333 10.6067 21.3908C10.6761 21.8486 10.771 22.3067 10.8913 22.765L7.11878 25.5508L8.68211 28.3492L12.9784 26.4917C13.6331 27.1622 14.3646 27.7305 15.1729 28.1967C15.9813 28.6628 16.8411 29.0069 17.7525 29.2292L18.3121 33.7892ZM20.0046 25.5554C21.5416 25.5554 22.8517 25.0137 23.935 23.9304C25.0184 22.8471 25.56 21.5369 25.56 20C25.56 18.463 25.0184 17.1529 23.935 16.0696C22.8517 14.9862 21.5416 14.4446 20.0046 14.4446C18.4604 14.4446 17.1485 14.9862 16.0688 16.0696C14.9891 17.1529 14.4492 18.463 14.4492 20C14.4492 21.5369 14.9891 22.8471 16.0688 23.9304C17.1485 25.0137 18.4604 25.5554 20.0046 25.5554Z"
										fill="#455A64"
									/>
								</g>
							</svg>
							<span
								className={
									this.state.isOffline || this.props.isTrackingDisabled
										? 'disable-manual'
										: ''
								}>
								{locales.SETTINGS}
							</span>
						</a>
						<span
							className="dropdown-item dropdown-item-horizontal subitem-container"
							href="#">
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
							className="dropdown-item item-horizontal"
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
							onClick={this.openShareFeedbackPage.bind(this)}
							className="dropdown-item item-horizontal"
							href="#"
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}>
							<span>{locales.SHARE_FEEDBACK}</span>
						</a>
						<a
							onClick={this.handleLogoutClick.bind(this)}
							className="dropdown-item item-horizontal"
							href="#">
							<span className={this.state.isOffline ? 'disable-manual' : ''}>
								{locales.LOG_OUT}
							</span>
						</a> */}
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
