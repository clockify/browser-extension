import React, { Component } from 'react';
import { getBrowser, isChrome } from '../helpers/browser-helper';
import Header from './header.component';

import { getLocalStorageEnums } from '../enums/local-storage.enum';
import { TimePicker } from 'antd';
import moment from 'moment';
import { HtmlStyleHelper } from '../helpers/html-style-helper';
import { getKeyCodes } from '../enums/key-codes.enum';
import Pomodoro from './pomodoro.component';
import DarkModeComponent from './dark-mode.component';
import DefaultProject from './default-project.component';

import Toaster from './toaster-component';
import HomePage from './home-page.component';
import locales from '../helpers/locales';

import dateFnsLocale from './date-fns-locale';
import { debug } from 'console';

const htmlStyleHelpers = new HtmlStyleHelper();

class Settings extends Component {
	constructor(props) {
		super(props);

		this.state = {
			userEmail: '',
			userPicture: '',
			userTimeFormat: 'HOUR24',
			createObjects: null,
			appendWebsiteURL: false,
			isSelfHosted: null,
			idleDetection: false,
			idleDetectionCounter: '',
			timerShortcut: true,
			reminder: false,
			reminderFromTime: '',
			reminderToTime: '',
			reminderMinutesSinceLastEntry: 0,
			contextMenuEnabled: true,
			autoStartOnBrowserStart: false,
			autoStopOnBrowserClose: false,
			showPostStartPopup: true,
			changeSaved: false,
			daysOfWeekLocales: [],
			daysOfWeek: [
				{ id: 1, name: 'MON', active: true },
				{ id: 2, name: 'TUE', active: true },
				{ id: 3, name: 'WED', active: true },
				{ id: 4, name: 'THU', active: true },
				{ id: 5, name: 'FRI', active: true },
				{ id: 6, name: 'SAT', active: false },
				{ id: 7, name: 'SUN', active: false },
			],
			stopTimerOnSelectedTime: false,
			timeToStopTimer: '',
		};

		this.pomodoroEnd = React.createRef();
		this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
		this.toggleDay = this.toggleDay.bind(this);
		this.checkForRemindersDatesAndTimes =
			this.checkForRemindersDatesAndTimes.bind(this);
		this.toggleStopTimerOnSelectedTime =
			this.toggleStopTimerOnSelectedTime.bind(this);
	}

	async setAsyncStateItems() {
		const createObjects = JSON.parse(
			await localStorage.getItem('createObjects', false)
		);
		const isSelfHosted = JSON.parse(
			await localStorage.getItem('selfHosted', false)
		);
		const daysOfWeekLocales = await dateFnsLocale.getDaysShort();
		const userEmail = await localStorage.getItem('userEmail');
		const userPicture = await localStorage.getItem('profilePicture');
		this.setState({
			createObjects,
			isSelfHosted,
			daysOfWeekLocales,
			userEmail,
			userPicture,
		});
	}

	componentDidMount() {
		this.getUserSettings();
		this.scrollIntoView = this.scrollIntoView.bind(this);
		this.setAsyncStateItems();
	}

	scrollIntoView() {
		setTimeout(() => {
			this.pomodoroEnd.current.scrollIntoView({ behavior: 'smooth' });
		}, 200);
	}

	async isAppendWebsiteURLOn() {
		const appendWebsiteURL = await localStorage.getItem('appendWebsiteURL');
		this.setState({
			appendWebsiteURL,
		});
	}

	async isIdleDetectionOn() {
		const idleDetectionFromStorage = await localStorage.getItem(
			'idleDetection'
		);
		const userId = await localStorage.getItem('userId');

		this.setState({
			idleDetectionCounter:
				idleDetectionFromStorage &&
				JSON.parse(idleDetectionFromStorage).filter(
					(idleDetectionByUser) =>
						idleDetectionByUser.userId === userId &&
						idleDetectionByUser.counter > 0
				).length > 0
					? JSON.parse(idleDetectionFromStorage).filter(
							(idleDetectionByUser) =>
								idleDetectionByUser.userId === userId &&
								idleDetectionByUser.counter > 0
					  )[0].counter
					: 0,
			idleDetection: !!(
				idleDetectionFromStorage &&
				JSON.parse(idleDetectionFromStorage).filter(
					(idleDetectionByUser) =>
						idleDetectionByUser.userId === userId &&
						idleDetectionByUser.counter > 0
				).length > 0
			),
		});
	}

	async isShowPostStartPopup() {
		const showPostStartPopup = JSON.parse(
			await localStorage.getItem('permanent_showPostStartPopup', 'true')
		);
		this.setState({ showPostStartPopup });
		localStorage.setItem(
			'showPostStartPopup',
			showPostStartPopup.toString(),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
	}

	async isTimerShortcutOn() {
		const timerShortcutFromStorage = await localStorage.getItem(
			'timerShortcut'
		);
		const userId = await localStorage.getItem('userId');

		this.setState({
			timerShortcut:
				timerShortcutFromStorage &&
				JSON.parse(timerShortcutFromStorage).filter(
					(timerShortcutByUser) =>
						timerShortcutByUser &&
						timerShortcutByUser.userId === userId &&
						timerShortcutByUser.enabled
				).length > 0,
		});
	}

	async isContextMenuOn() {
		const contextMenuEnabled = JSON.parse(
			await localStorage.getItem('contextMenuEnabled', 'true')
		);
		this.setState({ contextMenuEnabled });
	}

	async isReminderOn() {
		const reminderFromStorage = await localStorage.getItem('reminders');
		const userId = await localStorage.getItem('userId');
		const reminderFromStorageForUser = reminderFromStorage
			? JSON.parse(reminderFromStorage).filter(
					(reminder) => reminder.userId === userId
			  )[0]
			: null;

		if (!reminderFromStorageForUser) {
			return;
		}

		this.setState({
			reminder: reminderFromStorageForUser.enabled,
		});

		setTimeout(() => this.checkForRemindersDatesAndTimes(), 200);
	}

	async getMemberProfile() {
		const activeWorkspaceId = await localStorage.getItem(
			'activeWorkspaceId'
		);
		 getBrowser().runtime.sendMessage({eventName:'getMemberProfile', options: {userId: this.state.userId, workspaceId: activeWorkspaceId}})
		 .then((response) => {
			console.log('member profile', response);
			this.setState(
			{
				memberProfile: response.data,
			},
			() => {
				this.isStopTimerOnSelectedTimeOn();
			}
		);
		});		
	}

	getDefaultStopTime(startTime) {
		let formattedTime = '17:00';
		// if (this.state.reminderSettings) {
		// 	console.log('remindersForUser', remindersForUser);
		if (this.state.memberProfile && this.state.memberProfile.workCapacity) {
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
				this.state.memberProfile.workCapacity.match(/\d+H/)[0]; // extract the number of hours
			const capacityMinutes =
				this.state.memberProfile.workCapacity.match(/\d+M/); // try to extract the number of minutes
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

	convert24To12(time) {
		// Split the input time into hours and minutes
		const [hours, minutes] = time.split(':');

		// Convert the hours to 12-hour format
		let newHours = parseInt(hours);
		if (newHours > 12) {
			newHours -= 12;
		} else if (newHours === 0) {
			newHours = 12;
		}

		// Return the 12-hour time as a string
		return `${newHours}:${minutes}`;
	}

	async isStopTimerOnSelectedTimeOn() {
		const userData = this.state.user;
		const stopTimerOnSelectedTime = await localStorage.getItem(
			'stopTimerOnSelectedTime'
		);
		let defaultStopTime = this.getDefaultStopTime(
			userData.settings.myStartOfDay
		);
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

			this.setState({
				timeToStopTimer: defaultStopTime,
			});
			return;
		}
		const stopTimerOnSelectedTimeForUser = stopTimerOnSelectedTime
			? JSON.parse(stopTimerOnSelectedTime).find(
					(stopTimerOnSelectedTime) =>
						stopTimerOnSelectedTime.userId === userData.id
			  )
			: null;
		// if there is no stopTimerOnSelectedTime for the user, set it to default
		if (!stopTimerOnSelectedTimeForUser) {
			localStorage.setItem(
				'stopTimerOnSelectedTime',
				JSON.stringify([
					...JSON.parse(stopTimerOnSelectedTime),
					[
						{
							userId: userId,
							enabled: false,
							time: defaultStopTime,
						},
					],
				]),
				getLocalStorageEnums().PERMANENT_PREFIX
			);
				this.setState({
				timeToStopTimer: defaultStopTime,
			});
			return;
		}
		this.setState(
			{
				stopTimerOnSelectedTime: stopTimerOnSelectedTimeForUser.enabled,
				timeToStopTimer: stopTimerOnSelectedTimeForUser.time,
			},
			() => {
				getBrowser().runtime.sendMessage({ eventName: 'createStopTimerEvent' });
			}
		);
	}

	async isAutoStartStopOn() {
		const userId = await localStorage.getItem('userId');
		const autoStartOnBrowserStart = await localStorage.getItem(
			'autoStartOnBrowserStart'
		);
		const autoStartFromStorage = autoStartOnBrowserStart
			? JSON.parse(autoStartOnBrowserStart)
			: [];
		const autoStopOnBrowserClose = await localStorage.getItem(
			'autoStopOnBrowserClose'
		);
		const autoStopFromStorage = autoStopOnBrowserClose
			? JSON.parse(autoStopOnBrowserClose)
			: [];

		this.setState({
			autoStartOnBrowserStart:
				autoStartFromStorage.filter(
					(autoStart) => autoStart.userId === userId && autoStart.enabled
				).length > 0,
			autoStopOnBrowserClose:
				autoStopFromStorage.filter(
					(autoStop) => autoStop.userId === userId && autoStop.enabled
				).length > 0,
		});
	}

	async checkForRemindersDatesAndTimes() {
		const userId = await localStorage.getItem('userId');
		const reminderDatesAndTimesFromStorageForUser = JSON.parse(
			await localStorage.getItem('reminderDatesAndTimes')
		).filter(
			(reminderDatesAndTimes) => reminderDatesAndTimes.userId === userId
		)[0];

		this.setState((state) => ({
			reminderFromTime: reminderDatesAndTimesFromStorageForUser.timeFrom,
			reminderToTime: reminderDatesAndTimesFromStorageForUser.timeTo,
			reminderMinutesSinceLastEntry: parseInt(
				reminderDatesAndTimesFromStorageForUser.minutesSinceLastEntry
			),
			daysOfWeek: state.daysOfWeek.map((day) => ({
				...day,
				active: reminderDatesAndTimesFromStorageForUser.dates.includes(day.id),
			})),
		}));
	}

	getUserSettings() {
		getBrowser()
			.runtime.sendMessage({
				eventName: 'getUser',
			}).then((response) => {
			let data = response.data;
			console.log('userData', data);
			this.setState(
				{
					user: data,
					userId: data.id,
					userEmail: data.email,
					userPicture: data.profilePicture,
					userTimeFormat: data.settings.timeFormat,
					userStartOfDay: data.settings.myStartOfDay,
				},
				() => {
					localStorage.setItem('userEmail', this.state.userEmail);
					localStorage.setItem('profilePicture', this.state.userPicture);
					this.getMemberProfile();
					this.isIdleDetectionOn();
					this.isReminderOn();
					this.isAutoStartStopOn();
					this.isTimerShortcutOn();
					this.isContextMenuOn();
					this.isShowPostStartPopup();
					this.isAppendWebsiteURLOn();
				}
			);
		});
	}

	toggleShowPostStartPopup() {
		const showPostStartPopup = !this.state.showPostStartPopup;
		this.setState({ showPostStartPopup });
		localStorage.setItem(
			'showPostStartPopup',
			showPostStartPopup.toString(),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
		this.showSuccessMessage();
	}

	toggleCreateObjects() {
		if (this.state.createObjects) {
			localStorage.setItem(
				'createObjects',
				false,
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.setState({
				createObjects: false,
			});
		} else {
			localStorage.setItem(
				'createObjects',
				true,
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.setState({
				createObjects: true,
			});
		}
		this.showSuccessMessage();
	}

	toggleAppendWebsiteURL() {
		if (this.state.appendWebsiteURL) {
			localStorage.setItem(
				'appendWebsiteURL',
				false,
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.setState({
				appendWebsiteURL: false,
			});
		} else {
			localStorage.setItem(
				'appendWebsiteURL',
				true,
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.setState({
				appendWebsiteURL: true,
			});
		}
		this.showSuccessMessage();
	}

	async toggleIdleDetection() {
		const idleDetectionFromStorage = await localStorage.getItem(
			'idleDetection'
		);
		const userId = await localStorage.getItem('userId');
		let idleDetectionToSaveInStorage;
		let idleCounter;

		if (this.state.idleDetection) {
			idleDetectionToSaveInStorage = JSON.parse(
				idleDetectionFromStorage
			).filter((idleDetection) => idleDetection.userId !== userId);

			this.setState({
				idleDetection: false,
			});
			idleCounter = 0;
			this.sendIdleDetectionRequest(idleCounter);
		} else {
			idleCounter = 15;
			const idleDetectionForCurrentUser = {
				userId: userId,
				counter: idleCounter,
			};
			idleDetectionToSaveInStorage = idleDetectionFromStorage
				? [...JSON.parse(idleDetectionFromStorage), idleDetectionForCurrentUser]
				: [idleDetectionForCurrentUser];

			this.setState({
				idleDetection: true,
				idleDetectionCounter: idleCounter,
			});

			this.sendIdleDetectionRequest(idleCounter);
		}

		localStorage.setItem(
			'idleDetection',
			JSON.stringify(idleDetectionToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		this.showSuccessMessage();
	}

	async changeIdleCounter(event) {
		let value = parseInt(event.target.value);
		if (value === 0) {
			value = 1;
		}

		const userId = await localStorage.getItem('userId');
		const idleDetectionFromStorage = await localStorage.getItem(
			'idleDetection'
		);

		let idleDetectionToSaveInStorage = JSON.parse(
			idleDetectionFromStorage
		).filter((idleDetection) => idleDetection.userId !== userId);

		const idleDetectionForCurrentUserFromStorage = JSON.parse(
			idleDetectionFromStorage
		).filter((idleDetection) => idleDetection.userId === userId)[0];

		const idleDetectionForCurrentUserChanged = {
			userId: userId,
			counter: value ? value : idleDetectionForCurrentUserFromStorage.counter,
		};

		this.setState({
			idleDetectionCounter: value
				? value
				: idleDetectionForCurrentUserFromStorage.counter,
		});

		this.sendIdleDetectionRequest(idleDetectionForCurrentUserChanged.counter);

		idleDetectionToSaveInStorage = [
			...idleDetectionToSaveInStorage,
			idleDetectionForCurrentUserChanged,
		];

		localStorage.setItem(
			'idleDetection',
			JSON.stringify(idleDetectionToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		this.showSuccessMessage();
	}

	changeIdleDetectionCounterState(event) {
		this.setState({
			idleDetectionCounter: event.target.value,
		});
	}

	sendIdleDetectionRequest(counter) {
		getBrowser().runtime.sendMessage({
			eventName: 'idleDetection',
			counter: counter,
		});
	}

	sendReminderRequest() {
		getBrowser().runtime.sendMessage({
			eventName: 'reminder',
		});
	}

	async toggleTimerShortcut() {
		const timerShortcutFromStorage = await localStorage.getItem(
			'timerShortcut'
		);
		const userId = await localStorage.getItem('userId');
		let timerShortcutToSaveInStorage;

		if (this.state.timerShortcut) {
			timerShortcutToSaveInStorage = JSON.parse(timerShortcutFromStorage).map(
				(timerShortcut) => {
					if (timerShortcut.userId === userId) {
						timerShortcut.enabled = false;
						return timerShortcut;
					}
				}
			);

			this.setState({
				timerShortcut: false,
			});
		} else {
			timerShortcutToSaveInStorage = JSON.parse(timerShortcutFromStorage).map(
				(timerShortcut) => {
					if (timerShortcut.userId === userId) {
						timerShortcut.enabled = true;
						return timerShortcut;
					}
				}
			);

			this.setState({
				timerShortcut: true,
			});
		}

		if (timerShortcutToSaveInStorage) {
			localStorage.setItem(
				'timerShortcut',
				JSON.stringify(timerShortcutToSaveInStorage),
				getLocalStorageEnums().PERMANENT_PREFIX
			);
			this.showSuccessMessage();
		}
	}

	async toggleReminder() {
		const reminders = await localStorage.getItem('reminders');
		const reminderFromStorage = reminders ? JSON.parse(reminders) : [];
		const userId = await localStorage.getItem('userId');
		const reminderForCurrentUser =
			reminderFromStorage &&
			reminderFromStorage.filter((reminder) => reminder.userId === userId)
				.length > 0
				? reminderFromStorage.filter(
						(reminder) => reminder.userId === userId
				  )[0]
				: null;
		const reminderDatesAndTimes = await localStorage.getItem(
			'reminderDatesAndTimes'
		);
		const reminderDatesAndTimesFromStorage = reminderDatesAndTimes
			? JSON.parse(reminderDatesAndTimes)
			: [];
		let reminderToSaveInStorage;
		let reminderDatesAndTimesToSaveInStorage;

		if (!reminderForCurrentUser) {
			reminderToSaveInStorage = [
				...reminderFromStorage,
				{ userId: userId, enabled: true },
			];
			reminderDatesAndTimesToSaveInStorage = [
				...reminderDatesAndTimesFromStorage,
				{
					userId: userId,
					dates: [1, 2, 3, 4, 5],
					timeFrom: '09:00',
					timeTo: '17:00',
					minutesSinceLastEntry: 10,
				},
			];

			localStorage.setItem(
				'reminderDatesAndTimes',
				JSON.stringify(reminderDatesAndTimesToSaveInStorage),
				getLocalStorageEnums().PERMANENT_PREFIX
			);

			this.setState(
				{
					reminder: true,
					reminderFromTime: '09:00',
					reminderToTime: '17:00',
					reminderMinutesSinceLastEntry: 10,
				},
				() => {
					this.checkForRemindersDatesAndTimes();
					this.sendReminderRequest();
				}
			);
		} else {
			if (this.state.reminder) {
				reminderToSaveInStorage = reminderFromStorage.map((reminder) => {
					if (reminder.userId === userId) {
						reminder.enabled = false;

						this.setState(
							{
								reminder: false,
							},
							() => {
								getBrowser().runtime.sendMessage({
									eventName: 'removeReminderTimer',
								});
							}
						);
					}
					return reminder;
				});
			} else {
				reminderToSaveInStorage = reminderFromStorage.map((reminder) => {
					if (reminder.userId === userId) {
						reminder.enabled = true;

						this.setState(
							{
								reminder: true,
							},
							() => {
								this.checkForRemindersDatesAndTimes();
								this.sendReminderRequest();
							}
						);
					}
					return reminder;
				});
			}
		}

		localStorage.setItem(
			'reminders',
			JSON.stringify(reminderToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		this.showSuccessMessage();
	}

	async toggleStopTimerOnSelectedTime() {
		const stopTimerOnSelectedTime = await localStorage.getItem(
			'stopTimerOnSelectedTime'
		);
		let { settings: userSettings } = this.state.user;
		// myStartOfDay 09:00 & timeFormat HOUR24
		const stopTimerOnSelectedTimeFromStorage = stopTimerOnSelectedTime
			? JSON.parse(stopTimerOnSelectedTime)
			: [];
		const userId = this.state.user.id;
		const stopTimerOnSelectedTimeForCurrentUser =
			stopTimerOnSelectedTimeFromStorage &&
			stopTimerOnSelectedTimeFromStorage.filter(
				(stopTimerOnSelectedTime) => stopTimerOnSelectedTime.userId === userId
			).length > 0
				? stopTimerOnSelectedTimeFromStorage.find(
						(stopTimerOnSelectedTime) =>
							stopTimerOnSelectedTime.userId === userId
				  )
				: null;
		let stopTimerOnSelectedTimeToSaveInStorage;

		if (!stopTimerOnSelectedTimeForCurrentUser) {
			stopTimerOnSelectedTimeToSaveInStorage =
				stopTimerOnSelectedTimeFromStorage.map((stopTimerOnSelectedTime) => {
					if (stopTimerOnSelectedTime.userId === userId) {
						stopTimerOnSelectedTime.enabled = true;
						stopTimerOnSelectedTime.time = this.getDefaultStopTime(
							userSettings.myStartOfDay
						);
					}
					return stopTimerOnSelectedTime;
				});

			this.setState({
				stopTimerOnSelectedTime: true,
			});
		} else {
			if (this.state.stopTimerOnSelectedTime) {
				stopTimerOnSelectedTimeToSaveInStorage =
					stopTimerOnSelectedTimeFromStorage.map((stopTimerOnSelectedTime) => {
						if (stopTimerOnSelectedTime.userId === userId) {
							stopTimerOnSelectedTime.enabled = false;

							this.setState(
								{
									stopTimerOnSelectedTime: false,
								},
								() => {
									getBrowser().runtime.sendMessage({
										eventName: 'removeStopTimerEvent',
									});
								}
							);
						}
						return stopTimerOnSelectedTime;
					});
			} else {
				stopTimerOnSelectedTimeToSaveInStorage =
					stopTimerOnSelectedTimeFromStorage.map((stopTimerOnSelectedTime) => {
						if (stopTimerOnSelectedTime.userId === userId) {
							stopTimerOnSelectedTime.enabled = true;

							this.setState(
								{
									stopTimerOnSelectedTime: true,
								},
								() => {
									getBrowser().runtime.sendMessage({
										eventName: 'createStopTimerEvent',
									});
								}
							);
						}
						return stopTimerOnSelectedTime;
					});
			}
		}

		localStorage.setItem(
			'stopTimerOnSelectedTime',
			JSON.stringify(stopTimerOnSelectedTimeToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		this.showSuccessMessage();
	}

	calculateDelayInMinutes(userTime) {
		// parse the user-specified time to extract the hour, minute, and second values
		var userTimeParts = userTime.split(':');
		var userHour = parseInt(userTimeParts[0]);
		var userMinute = parseInt(userTimeParts[1]);
		var userSecond = parseInt(userTimeParts[2] || 0);

		// calculate the current time
		var currentTime = new Date();
		var currentHour = currentTime.getHours();
		var currentMinute = currentTime.getMinutes();
		var currentSecond = currentTime.getSeconds();

		// subtract the current time from the user-specified time to get the difference in milliseconds
		var differenceInMilliseconds =
			(userHour - currentHour) * 3600 * 1000 +
			(userMinute - currentMinute) * 60 * 1000 +
			(userSecond - currentSecond) * 1000;

		// divide the difference in milliseconds by the number of milliseconds in a minute to get the difference in minutes
		var delayInMinutes = differenceInMilliseconds / 60000;

		return delayInMinutes;

		//chrome.alarms.create('myAlarm', { delayInMinutes: delayInMinutes });
	}

	async changeReminderMinutes(event) {
		let value = parseInt(event.target.value);

		if (value === 0) {
			value = 1;
		}

		const userId = await localStorage.getItem('userId');
		const remindersDatesAndTimesToSaveInStorage = JSON.parse(
			await localStorage.getItem('reminderDatesAndTimes')
		).map((reminder) => {
			if (reminder.userId === userId) {
				reminder.minutesSinceLastEntry = value
					? value
					: reminder.minutesSinceLastEntry;

				this.setState({
					reminderMinutesSinceLastEntry: value
						? value
						: reminder.minutesSinceLastEntry,
				});
			}

			return reminder;
		});

		localStorage.setItem(
			'reminderDatesAndTimes',
			JSON.stringify(remindersDatesAndTimesToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		getBrowser().runtime.sendMessage({
			eventName: 'removeReminderTimer',
		});
		getBrowser().runtime.sendMessage({
			eventName: 'reminder',
		});

		this.showSuccessMessage();
	}

	changeReminderMinutesState(event) {
		this.setState({
			reminderMinutesSinceLastEntry: event.target.value,
		});
	}

	toggleContextMenu() {
		const contextMenuEnabled = !this.state.contextMenuEnabled;
		this.setState({ contextMenuEnabled });
		localStorage.setItem(
			'contextMenuEnabled',
			JSON.stringify(contextMenuEnabled),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
		this.sendToggleContextMenuRequest(contextMenuEnabled);
		this.showSuccessMessage();
	}

	sendToggleContextMenuRequest(iscontextMenuEnabled) {
		getBrowser().runtime.sendMessage({
			eventName: 'contextMenuEnabledToggle',
			enabled: iscontextMenuEnabled,
		});
	}

	async toggleDay(dayName) {
		const day = this.state.daysOfWeek.find((day) => day.name === dayName);
		const userId = await localStorage.getItem('userId');
		const reminderDatesAndTimesFromStorage = JSON.parse(
			await localStorage.getItem('reminderDatesAndTimes')
		).map((reminder) => {
			if (reminder.userId === userId) {
				if (reminder.dates.includes(day.id)) {
					reminder.dates.splice(reminder.dates.indexOf(day.id), 1);
					this.setState((state) => ({
						daysOfWeek: state.daysOfWeek.map((day) => ({
							...day,
							active: day.name === dayName ? false : day.active,
						})),
					}));
				} else {
					reminder.dates.push(day.id);
					this.setState((state) => ({
						daysOfWeek: state.daysOfWeek.map((day) => ({
							...day,
							active: day.name === dayName ? true : day.active,
						})),
					}));
				}
			}

			return reminder;
		});

		localStorage.setItem(
			'reminderDatesAndTimes',
			JSON.stringify(reminderDatesAndTimesFromStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		getBrowser().runtime.sendMessage({
			eventName: 'removeReminderTimer',
		});
		getBrowser().runtime.sendMessage({
			eventName: 'reminder',
		});

		this.showSuccessMessage();
	}

	selectTimeToStopTimer(time, timeString) {
		if (timeString) {
			this.setState({
				timeToStopTimer: timeString,
			});
		}
	}

	openTimeToStopTimerPicker(event) {
		this.fadeBackgroundAroundTimePicker(event);
		if (!event) {
			if (this.state.timeToStopTimer) {
				this.changeStopTimerTime(this.state.timeToStopTimer);
			}
		}
	}

	selectReminderFromTime(time, timeString) {
		if (timeString) {
			this.setState({
				reminderFromTime: timeString,
			});
		}
	}

	selectReminderToTime(time, timeString) {
		if (timeString) {
			this.setState({
				reminderToTime: timeString,
			});
		}
	}

	openReminderFromTimePicker(event) {
		this.fadeBackgroundAroundTimePicker(event);
		if (!event) {
			if (this.state.reminderFromTime) {
				this.changeTime(this.state.reminderFromTime, 'fromTime');
			}
		}
	}

	openReminderToTimePicker(event) {
		this.fadeBackgroundAroundTimePicker(event);
		if (!event) {
			if (this.state.reminderToTime) {
				this.changeTime(this.state.reminderToTime, 'toTime');
			}
		}
	}

	async changeStopTimerTime(time) {
		const stopOnSelectedTime = await localStorage.getItem(
			'stopTimerOnSelectedTime'
		);
		const stopOnSelectedTimeParsed = JSON.parse(stopOnSelectedTime);
		const stopTimerOnSelectedTimeToSaveInStorage = stopOnSelectedTimeParsed.map(
			(stopTimer) => {
				if (stopTimer.userId === this.state.user.id) {
					stopTimer.time = time;
				}

				return stopTimer;
			}
		);

		localStorage.setItem(
			'stopTimerOnSelectedTime',
			JSON.stringify(stopTimerOnSelectedTimeToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);
		getBrowser().runtime.sendMessage({
			eventName: 'createStopTimerEvent',
		});

		this.showSuccessMessage();
	}

	async changeTime(time, type) {
		const userId = await localStorage.getItem('userId');
		const remindersForCurrentUserToSaveInStorage = JSON.parse(
			await localStorage.getItem('reminderDatesAndTimes')
		).map((reminder) => {
			if (reminder.userId === userId) {
				if (type === 'fromTime') {
					reminder.timeFrom = time;
				} else {
					reminder.timeTo = time;
				}
			}

			return reminder;
		});

		localStorage.setItem(
			'reminderDatesAndTimes',
			JSON.stringify(remindersForCurrentUserToSaveInStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		getBrowser().runtime.sendMessage({
			eventName: 'removeReminderTimer',
		});
		getBrowser().runtime.sendMessage({
			eventName: 'reminder',
		});

		this.showSuccessMessage();
	}

	fadeBackgroundAroundTimePicker(event) {
		if (event) {
			htmlStyleHelpers.fadeBackground();
		} else {
			setTimeout(() => {
				htmlStyleHelpers.unfadeBackground();
			}, 100);
		}
	}

	changeReminderMinutesOnEnter(event) {
		const { enter, minus } = getKeyCodes();
		if (minus.includes(event.keyCode)) {
			if (event.preventDefault) event.preventDefault();
			return false;
		} else if (enter.includes(event.keyCode)) {
			this.changeReminderMinutes(event);
		}
	}

	changeIdleCounterOnEnter(event) {
		const { enter, minus } = getKeyCodes();
		if (minus.includes(event.keyCode)) {
			if (event.preventDefault) event.preventDefault();
			return false;
		} else if (enter.includes(event.keyCode)) {
			this.changeIdleCounter(event);
		}
	}

	async toggleAutoStartOnBrowserStart() {
		const userId = await localStorage.getItem('userId');
		const autoStartOnBrowserStart = await localStorage.getItem(
			'autoStartOnBrowserStart'
		);
		let autoStartFromStorage = autoStartOnBrowserStart
			? JSON.parse(autoStartOnBrowserStart)
			: [];
		const autoStartForCurrentUser =
			autoStartFromStorage &&
			autoStartFromStorage.filter((autoStart) => autoStart.userId === userId)
				.length > 0
				? autoStartFromStorage.filter(
						(autoStart) => autoStart.userId === userId
				  )[0]
				: null;

		if (!autoStartForCurrentUser) {
			autoStartFromStorage = [
				...autoStartFromStorage,
				{ userId: userId, enabled: true },
			];

			this.setState({
				autoStartOnBrowserStart: true,
			});
		} else {
			if (this.state.autoStartOnBrowserStart) {
				autoStartFromStorage = autoStartFromStorage.map((autoStart) => {
					if (autoStart.userId === userId) {
						autoStart.enabled = false;
					}

					return autoStart;
				});
				this.setState({
					autoStartOnBrowserStart: false,
				});
			} else {
				autoStartFromStorage = autoStartFromStorage.map((autoStart) => {
					if (autoStart.userId === userId) {
						autoStart.enabled = true;
					}

					return autoStart;
				});

				this.setState({
					autoStartOnBrowserStart: true,
				});
			}
		}

		localStorage.setItem(
			'autoStartOnBrowserStart',
			JSON.stringify(autoStartFromStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		this.showSuccessMessage();
	}

	async toggleAutoStopOnBrowserClose() {
		const userId = await localStorage.getItem('userId');
		const autoStopOnBrowserClose = await localStorage.getItem(
			'autoStopOnBrowserClose'
		);
		let autoStopFromStorage = autoStopOnBrowserClose
			? JSON.parse(autoStopOnBrowserClose)
			: [];
		const autoStopForCurrentUser =
			autoStopFromStorage &&
			autoStopFromStorage.filter((autoStop) => autoStop.userId === userId)
				.length > 0
				? autoStopFromStorage.filter(
						(autoStop) => autoStop.userId === userId
				  )[0]
				: null;

		if (!autoStopForCurrentUser) {
			autoStopFromStorage = [
				...autoStopFromStorage,
				{ userId: userId, enabled: true },
			];

			this.setState({
				autoStopOnBrowserClose: true,
			});
		} else {
			if (this.state.autoStopOnBrowserClose) {
				autoStopFromStorage = autoStopFromStorage.map((autoStop) => {
					if (autoStop.userId === userId) {
						autoStop.enabled = false;
					}

					return autoStop;
				});
				this.setState({
					autoStopOnBrowserClose: false,
				});
			} else {
				autoStopFromStorage = autoStopFromStorage.map((autoStop) => {
					if (autoStop.userId === userId) {
						autoStop.enabled = true;
					}

					return autoStop;
				});

				this.setState({
					autoStopOnBrowserClose: true,
				});
			}
		}

		localStorage.setItem(
			'autoStopOnBrowserClose',
			JSON.stringify(autoStopFromStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		this.showSuccessMessage();
	}

	showSuccessMessage() {
		this.toaster.toast('success', `${locales.CHANGE_SAVED}.`, 2);
	}

	async goBackToHomePage() {
		window.reactRoot.render(<HomePage />);
	}

	render() {
		let version;

		return (
			<div className="settings_page">
				<Toaster
					ref={(instance) => {
						this.toaster = instance;
					}}
				/>
				<div className="settings_page__header">
					<Header
						showActions={false}
						backButton={true}
						goBackTo={this.goBackToHomePage.bind(this)}
					/>
				</div>
				<div className="user-settings">
					<span>
						{this.state.userPicture && <img src={this.state.userPicture} />}
					</span>
					<span>{this.state.userEmail}</span>
				</div>
				<DefaultProject
					workspaceSettings={this.props.workspaceSettings}
					changeSaved={this.showSuccessMessage.bind(this)}
				/>
				<div
					className="settings__send-errors"
					onClick={this.toggleCreateObjects.bind(this)}
				>
					<span
						className={
							this.state.createObjects
								? 'settings__send-errors__checkbox checked'
								: 'settings__send-errors__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.createObjects
									? 'settings__send-errors__checkbox--img'
									: 'settings__send-errors__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.INTEGRATIONS_CAN_CREATE_PROJECTS}
					</span>
				</div>
				<div
					className="settings__send-errors"
					onClick={this.toggleAppendWebsiteURL.bind(this)}
				>
					<span
						className={
							this.state.appendWebsiteURL
								? 'settings__send-errors__checkbox checked'
								: 'settings__send-errors__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.appendWebsiteURL
									? 'settings__send-errors__checkbox--img'
									: 'settings__send-errors__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.APPEND_THE_WEBSITE_URL}
					</span>
				</div>
				<DarkModeComponent changeSaved={this.showSuccessMessage.bind(this)} />

				<div
					className="settings__send-errors"
					onClick={this.toggleShowPostStartPopup.bind(this)}
				>
					<span
						className={
							this.state.showPostStartPopup
								? 'settings__send-errors__checkbox checked'
								: 'settings__send-errors__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.showPostStartPopup
									? 'settings__send-errors__checkbox--img'
									: 'settings__send-errors__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.SHOW_POST_START_POPUP}
					</span>
				</div>

				<div
					className={
						!this.state.isSelfHosted ? 'settings__send-errors' : 'disabled'
					}
					onClick={this.toggleTimerShortcut.bind(this)}
				>
					<span
						className={
							this.state.timerShortcut
								? 'settings__send-errors__checkbox checked'
								: 'settings__send-errors__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.timerShortcut
									? 'settings__send-errors__checkbox--img'
									: 'settings__send-errors__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.START}/{locales.STOP} {locales.TIMER} {locales.SHORTCUT}
					</span>
					<span className="settings__send-errors__title--shortcut">
						(Ctrl+Shift+U)
					</span>
				</div>
				<div
					className="settings__auto_start_on_browser_start"
					onClick={this.toggleAutoStartOnBrowserStart.bind(this)}
				>
					<span
						className={
							this.state.autoStartOnBrowserStart
								? 'settings__auto_start_on_browser_start__checkbox checked'
								: 'settings__auto_start_on_browser_start__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.autoStartOnBrowserStart
									? 'settings__auto_start_on_browser_start__checkbox--img'
									: 'settings__auto_start_on_browser_start__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__auto_start_on_browser_start__title">
						{locales.START_TIMER_WHEN_BROWSER_STARTS}
					</span>
				</div>
				<div
					className="settings__auto_stop_on_browser_close"
					onClick={this.toggleAutoStopOnBrowserClose.bind(this)}
				>
					<span
						className={
							this.state.autoStopOnBrowserClose
								? 'settings__auto_stop_on_browser_close__checkbox checked'
								: 'settings__auto_stop_on_browser_close__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.autoStopOnBrowserClose
									? 'settings__auto_stop_on_browser_close__checkbox--img'
									: 'settings__auto_stop_on_browser_close__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__auto_stop_on_browser_close__title">
						{locales.STOP_TIMER_WHEN_BROWSER_CLOSES}
					</span>
				</div>
				<div
					className="settings__stop_timer__section expandTrigger"
					onClick={() => this.toggleStopTimerOnSelectedTime()}
				>
					<span
						className={
							this.state.stopTimerOnSelectedTime
								? 'settings__stop_timer__section__checkbox checked'
								: 'settings__stop_timer__section__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.stopTimerOnSelectedTime
									? 'settings__stop_timer__section__checkbox--img'
									: 'settings__stop_timer__section__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.STOP_AT_SPECIFIED_TIME}
					</span>
				</div>
				<div
					id="stopTimer"
					className="settings__stop_timer expandContainer"
					style={{
						maxHeight: this.state.stopTimerOnSelectedTime ? '300px' : '0',
						paddingBottom: this.state.stopTimerOnSelectedTime ? '15px' : '0',
					}}
				>
					<div className="settings__stop_timer__times">
						<div className="settings__stop_timer__times--picker">
							<p>{locales.STOP_TIME}:</p>
							<TimePicker
								id="stopTimerOnSelectedTime"
								className="settings__stop_timer__time_picker"
								value={moment(
									this.state.userTimeFormat === 'HOUR12'
										? this.convert24To12(this.state.timeToStopTimer)
										: this.state.timeToStopTimer,
									'HH:mm'
								)}
								format="HH:mm"
								size="large"
								use12Hours={this.state.userTimeFormat === 'HOUR12'}
								onChange={this.selectTimeToStopTimer.bind(this)}
								onOpenChange={this.openTimeToStopTimerPicker.bind(this)}
								clearIcon={null}
							/>
						</div>
					</div>
				</div>
				<div
					className="settings__reminder__section expandTrigger"
					onClick={this.toggleReminder.bind(this)}
				>
					<span
						className={
							this.state.reminder
								? 'settings__reminder__section__checkbox checked'
								: 'settings__reminder__section__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.reminder
									? 'settings__reminder__section__checkbox--img'
									: 'settings__reminder__section__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.REMIND_ME_TO_TRACK_TIME}
					</span>
				</div>
				<div
					id="reminder"
					className="settings__reminder expandContainer"
					style={{
						maxHeight: this.state.reminder ? '300px' : '0',
					}}
				>
					<div className="settings__reminder__week">
						{this.state.daysOfWeek.map((day) => {
							return (
								<div
									id={'day_' + day.id}
									key={day.name}
									className={
										'settings__reminder__week__day' +
										(day.active ? ' day-active' : '')
									}
									onClick={() => this.toggleDay(day.name)}
								>
									<span className="settings__reminder__week__day--name">
										{this.state.daysOfWeekLocales[day.id === 7 ? 0 : day.id] ||
											day.name}
									</span>
								</div>
							);
						})}
					</div>
					<div className="settings__reminder__times">
						<div className="settings__reminder__times--from">
							<p>{locales.FROM}</p>
							<TimePicker
								id="reminderFromTime"
								className="settings__reminder__time_picker"
								value={moment(this.state.reminderFromTime, 'HH:mm')}
								format="HH:mm"
								size="small"
								onChange={this.selectReminderFromTime.bind(this)}
								onOpenChange={this.openReminderFromTimePicker.bind(this)}
							/>
						</div>
						<div className="settings__reminder__times--to">
							<p>{locales.TO}</p>
							<TimePicker
								id="reminderFromTime"
								className="settings__reminder__time_picker"
								value={moment(this.state.reminderToTime, 'HH:mm')}
								format="HH:mm"
								size="small"
								onChange={this.selectReminderToTime.bind(this)}
								onOpenChange={this.openReminderToTimePicker.bind(this)}
							/>
						</div>
					</div>
					<div className="settings__reminder__times--minutes_since_last_entry">
						<input
							value={this.state.reminderMinutesSinceLastEntry}
							onBlur={this.changeReminderMinutes.bind(this)}
							onKeyDown={this.changeReminderMinutesOnEnter.bind(this)}
							onChange={this.changeReminderMinutesState.bind(this)}
						/>
						<p>{locales.MINUTES_SINCE_LAST_ENTRY}</p>
					</div>
				</div>
				<div
					className="settings__context_menu__section"
					onClick={this.toggleContextMenu.bind(this)}
				>
					<span
						className={
							this.state.contextMenuEnabled
								? 'settings__context_menu__section__checkbox checked'
								: 'settings__context_menu__section__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.contextMenuEnabled
									? 'settings__context_menu__section__checkbox--img'
									: 'settings__context_menu__section__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.ENABLE_CONTEXT_MENU}
					</span>
				</div>
				<div
					className="settings__idle-detection expandTrigger"
					onClick={this.toggleIdleDetection.bind(this)}
				>
					<span
						className={
							this.state.idleDetection
								? 'settings__idle-detection__checkbox checked'
								: 'settings__idle-detection__checkbox'
						}
					>
						<img
							src="./assets/images/checked.png"
							className={
								this.state.idleDetection
									? 'settings__idle-detection__checkbox--img'
									: 'settings__idle-detection__checkbox--img_hidden'
							}
						/>
					</span>
					<span className="settings__send-errors__title">
						{locales.IDLE_DETECTION}
					</span>
				</div>
				<div
					id="idleDetection"
					className="settings__idle-detection__box expandContainer"
					style={{ maxHeight: this.state.idleDetection ? '100px' : '0' }}
				>
					<div className="settings__idle-detection__box__content">
						<p>{locales.DETECT_IDLE_TIME}</p>
						<input
							id="idleDetectionCounter"
							value={this.state.idleDetectionCounter}
							onBlur={this.changeIdleCounter.bind(this)}
							onKeyDown={this.changeIdleCounterOnEnter.bind(this)}
							onChange={this.changeIdleDetectionCounterState.bind(this)}
						/>
						<p>{locales.MINUTES}</p>
					</div>
				</div>
				<Pomodoro
					workspaceSettings={this.props.workspaceSettings}
					changeSaved={this.showSuccessMessage.bind(this)}
					scrollIntoView={this.scrollIntoView}
				/>
				<div ref={this.pomodoroEnd} />
				{version}
			</div>
		);
	}
}

export default Settings;
