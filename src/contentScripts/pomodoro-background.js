const minutesSymbol = 'm';
let lastIntervalId = null;
let breakButtons, long, breakOverButtons;

async function breakIntervalAlarm() {
	const { start, pomodoroBreakLength, pomodoroForUser, description } =
		await localStorage.getItem('breakIntervalProps');
	let breakCounter = await localStorage.getItem('breakCounter');
	const startDate = new Date(start);
	let counter = 0;

	const breakInterval = setInterval(() => {
		counter++;
		const currDate = new Date();
		const diff = currDate.getTime() - startDate.getTime();
		updateBadgeTime(diff, pomodoroBreakLength);
		if (diff >= pomodoroBreakLength) {
			clearInterval(breakInterval);
			if (pomodoroForUser.isAutomaticStartStop) {
				continueLastEntryAndNotify(pomodoroForUser, currDate);
			} else {
				createBreakOverNotification(pomodoroForUser);
			}
			description === 'Pomodoro break' && pomodoroForUser.isLongBreakEnabled
				? breakCounter++
				: (breakCounter = 0);
			localStorage.setItem('breakCounter', breakCounter);
		} else if (counter > 40) {
			clearInterval(breakInterval);
		}
	}, 1000);
	lastIntervalId = breakInterval;
}

async function pomodoroIntervalAlarm() {
	const { start, pomodoroForUser } = await localStorage.getItem(
		'pomodoroIntervalProps'
	);
	const breakCounter = await localStorage.getItem('breakCounter');
	const startDate = new Date(start);
	let counter = 0;

	const pomodoroInterval = setInterval(() => {
		counter++;
		const currDate = new Date();
		const diff = currDate.getTime() - startDate.getTime();
		updateBadgeTime(diff, pomodoroForUser.timerInterval * 60 * 1000);
		if (diff >= pomodoroForUser.timerInterval * 60 * 1000) {
			clearInterval(pomodoroInterval);
			if (
				pomodoroForUser.isLongBreakEnabled &&
				breakCounter >= pomodoroForUser.breakCounter
			) {
				if (pomodoroForUser.isAutomaticStartStop) {
					startBreakAndNotify('Pomodoro long break', pomodoroForUser, currDate);
				} else {
					createLongBreakNotification(pomodoroForUser);
				}
			} else {
				if (pomodoroForUser.isAutomaticStartStop) {
					startBreakAndNotify('Pomodoro break', pomodoroForUser, currDate);
				} else {
					createBreakNotification(pomodoroForUser);
				}
			}
		} else if (counter > 40) {
			clearInterval(pomodoroInterval);
		}
	}, 1000);
	lastIntervalId = pomodoroInterval;
}

aBrowser.alarms.onAlarm.addListener(async (alarm) => {
	if (lastIntervalId) {
		clearInterval(lastIntervalId);
		lastIntervalId = null;
	}
	switch (alarm.name) {
		case 'breakInterval':
			breakIntervalAlarm();
			break;
		case 'pomodoroInterval':
			pomodoroIntervalAlarm();
			break;
		default:
			break;
	}
});

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.eventName) {
		case 'addPomodoroTimer':
			this.addPomodoroTimer();
			break;
		case 'restartPomodoro':
			this.restartPomodoro();
			break;
		case 'removeBadge':
			this.removeBadge();
			break;
		case 'entryEnded':
			this.restartPomodoro();
			break;
		case 'entryStarted':
			const breakRegex = /Pomodoro (?:long )?break/;
			//if it's a break entry, don't start the timer
			if (breakRegex.test(request.options.entry.description)) return;
			this.addPomodoroTimer();
			break;
		// case 'resetBadge':
		//     this.resetBadge();
		//     break;
		default:
			break;
	}
});

async function getPomodoroForUser() {
	const userId = await localStorage.getItem('userId');
	const permanent_pomodoro = await localStorage.getItem('permanent_pomodoro');
	return permanent_pomodoro
		? JSON.parse(permanent_pomodoro).find((item) => item.userId === userId)
		: null;
}

function setBreakBadge(pomodoroForUser, description) {
	const isShortBreak = description === 'Pomodoro break';
	const minutes = isShortBreak
		? pomodoroForUser.shortBreak
		: pomodoroForUser.longBreak;

	setTimeout(() => {
		aBrowser.action.setBadgeText({
			text: `${minutes}${minutesSymbol}`,
		});
		console.log('setBreakBadge', minutes);
		if (!this.isChrome()) {
			aBrowser.action.setBadgeTextColor({
				color: '#FFFFFF',
			});
		}
		aBrowser.action.setBadgeBackgroundColor({
			color: '#FFC107',
		});
	}, 2000);
}

function setActiveBadge(minutes) {
	setTimeout(() => {
		if (minutes) {
			aBrowser.action.setBadgeText({
				text: `${minutes}${minutesSymbol}`,
			});
		}
		if (!this.isChrome()) {
			aBrowser.action.setBadgeTextColor({
				color: '#FFFFFF',
			});
		}
		aBrowser.action.setBadgeBackgroundColor({
			color: '#0288D1',
		});
	}, 2000);
}

function updateBadgeTime(diff, currentInterval) {
	let minutes = Math.ceil((currentInterval - diff) / (60 * 1000));
	if (minutes <= 0) {
		minutes = currentInterval / (60 * 1000);
	}
	aBrowser.action.setBadgeText({
		text: `${minutes}${minutesSymbol}`,
	});
}

function removeBadge() {
	aBrowser.action.setBadgeText({
		text: '',
	});
}

// async function resetBadge() {
//     const userId = await localStorage.getItem('userId');
//     const str = await localStorage.getItem('permanent_pomodoro');
//     const pomodoroForUser = str
//         ? JSON.parse(str).find(pomodoro => pomodoro.userId === userId)
//         : false;
//     if(pomodoroForUser && pomodoroForUser.enabled){
//         this.setActiveBadge(pomodoroForUser.timerInterval);
//     }else {
//         this.removeBadge();
//     }
// }

async function addPomodoroTimer() {
	let pomodoroAlreadyExists = await aBrowser.alarms.get('pomodoroInterval');
	if (pomodoroAlreadyExists) {
		return;
	} else {
		const userId = await localStorage.getItem('userId');
		const str = await localStorage.getItem('permanent_pomodoro');
		const pomodoroForUser = str
			? JSON.parse(str).find((pomodoro) => pomodoro.userId === userId)
			: false;

		if (pomodoroForUser && pomodoroForUser.enabled) {
			let { entry, error } = await TimeEntry.getEntryInProgress();
			if (error) entry = null;

			aBrowser.storage.local.set({
				timeEntryInProgress: entry,
			});

			if (!entry) return;

			// if (entry.description === 'Pomodoro break' || entry.description === 'Pomodoro long break') {
			//     this.removeBreakInterval();
			//     const pomodoroBreakLength = entry.description === 'Pomodoro break' ?
			//         pomodoroForUser.shortBreak * 60 * 1000 : pomodoroForUser.longBreak * 60 * 1000;

			//     localStorage.setItem('breakIntervalProps', {start: entry.timeInterval.start, pomodoroBreakLength, pomodoroForUser, description: entry.description});

			//     aBrowser.alarms.create('breakInterval', {
			//         periodInMinutes: 1,
			//         when: Date.now()
			//     });
			// } else {
			this.setActiveBadge(pomodoroForUser.timerInterval);
			// this.restartPomodoro();
			// this.removePomodoroInterval();

			localStorage.setItem('pomodoroIntervalProps', {
				start: entry.timeInterval.start,
				pomodoroForUser,
			});

			aBrowser.alarms.create('pomodoroInterval', {
				periodInMinutes: 1,
				when: Date.now() + 30000,
			});
			// }
		} else {
			this.removeBadge();
		}
	}
}

function removePomodoroInterval() {
	aBrowser.alarms.clear('pomodoroInterval');
}

function removeBreakInterval() {
	aBrowser.alarms.clear('breakInterval');
}

function clearTimeoutForRemovingNotification(notificationId, timeout) {
	const clearTimeout = setTimeout(() => {
		this.clearNotification(notificationId);
		this.clearTimeout(clearTimeout);
	}, timeout * 1000);
}

function removeAllPomodoroTimers() {
	this.removePomodoroInterval();
	this.removeBreakInterval();
	this.clearBreakOverNotification();
	this.clearBreakNotification();
	this.clearLongBreakNotification();
	if (typeof lastIntervalId !== 'undefined' && lastIntervalId) {
		clearInterval(lastIntervalId);
	}
}

function clearBreakOverNotification() {
	this.clearNotification('breakOver');
}

function clearBreakNotification() {
	this.clearNotification('pomodoroBreak');
}

function clearLongBreakNotification() {
	this.clearNotification('pomodoroLongBreak');
}

async function startBreakAndNotify(description, pomodoroForUser, endDate) {
	this.removePomodoroInterval();
	await this.startBreak(description, endDate);
	this.notifyAboutStartingBrake(description, pomodoroForUser);
}

function continueLastEntryAndNotify(pomodoroForUser, endDate) {
	this.removeBreakInterval();
	this.continueLastEntryByPomodoro(endDate);

	this.notifyThatBreakIsOver(pomodoroForUser);
}

function notifyAboutStartingBrake(description, pomodoroForUser) {
	const breakMinutes =
		description === 'Pomodoro break'
			? pomodoroForUser.shortBreak
			: pomodoroForUser.longBreak;

	const notificationOptions = {
		type: 'basic',
		iconUrl: './assets/icons/64x64.png',
		title: clockifyLocales.POMODORO_TIMER,
		// message: "Your " + breakMinutes + "-minute break has started."
		message: clockifyLocales.POMODORO_BREAK_STARTED(breakMinutes),
	};

	this.createNotification('pomodoroBreakNotify', notificationOptions);
	this.clearTimeoutForRemovingNotification('pomodoroBreakNotify', 10);
}

function notifyThatBreakIsOver(pomodoroForUser) {
	const notificationOptions = {
		type: 'basic',
		iconUrl: './assets/icons/64x64.png',
		title: clockifyLocales.POMODORO_TIMER,
		// message: "Your break has ended. Work timer resumed."
		message: clockifyLocales.POMODORO_BREAK_ENDED,
	};

	this.createNotification('pomodoroBreakOverNotify', notificationOptions);
	this.clearTimeoutForRemovingNotification('pomodoroBreakOverNotify', 10);
}

async function createBreakNotification(pomodoroForUser) {
	breakButtons = [clockifyLocales.STOP_TIMER, 'Start break'];
	const breakCounter = await localStorage.getItem('breakCounter');
	this.removePomodoroInterval();

	const buttonsForMessage = [
		{ title: breakButtons[0] },
		{ title: breakButtons[1] },
	];

	const notificationOptions = {
		type: 'basic',
		iconUrl: './assets/icons/64x64.png',
		title: clockifyLocales.POMODORO_TIMER,
		message: clockifyLocales.POMODORO_TAKE_BREAK(pomodoroForUser.timerInterval),
		// message: "You've been working " + pomodoroForUser.timerInterval + " minutes. Time to take a break!"
	};

	if (this.isChrome()) {
		notificationOptions.buttons = buttonsForMessage;
		notificationOptions.requireInteraction = true;
	} else {
		notificationOptions.message =
			notificationOptions.message +
			' ' +
			clockifyLocales.CLICK_HERE_TO_START_BREAK;
	}

	if (pomodoroForUser.isLongBreakEnabled) {
		notificationOptions.message =
			notificationOptions.message +
			' ' +
			clockifyLocales.SESSION(breakCounter + 1);
	}

	this.createNotification('pomodoroBreak', notificationOptions);
}

function createBreakOverNotification(pomodoroForUser) {
	breakOverButtons = [clockifyLocales.START_TIMER, 'Continue last'];
	this.removeBreakInterval();

	const buttonsForMessage = [
		{ title: breakOverButtons[0] },
		{ title: breakOverButtons[1] },
	];

	const notificationOptions = {
		type: 'basic',
		iconUrl: './assets/icons/64x64.png',
		title: clockifyLocales.POMODORO_TIMER,
		// message: "Break over. Time to work!"
		message: clockifyLocales.POMODORO_TIME_TO_WORK,
	};

	if (this.isChrome()) {
		notificationOptions.buttons = buttonsForMessage;
		notificationOptions.requireInteraction = true;
	} else {
		notificationOptions.message =
			notificationOptions.message +
			' ' +
			clockifyLocales.CLICK_HERE_TO_START_TIMER;
	}

	this.createNotification('breakOver', notificationOptions);
}

function createLongBreakNotification(pomodoroForUser) {
	longBreakButtons = [clockifyLocales.STOP_TIMER, 'Start long break'];
	this.removePomodoroInterval();

	const buttonsForMessage = [
		{ title: longBreakButtons[0] },
		{ title: longBreakButtons[1] },
	];

	const notificationOptions = {
		type: 'basic',
		iconUrl: './assets/icons/64x64.png',
		title: clockifyLocales.POMODORO_TIMER,
		message: clockifyLocales.POMODORO_TAKE_LONG_BREAK(
			pomodoroForUser.timerInterval
		),
		// message: "You've been working " + pomodoroForUser.timerInterval + " minutes. Time to take the long break!"
	};

	if (this.isChrome()) {
		notificationOptions.buttons = buttonsForMessage;
		notificationOptions.requireInteraction = true;
	} else {
		notificationOptions.message =
			notificationOptions.message +
			' ' +
			clockifyLocales.CLICK_HERE_TO_START_LONG_BREAK;
	}

	this.createNotification('pomodoroLongBreak', notificationOptions);
}

async function startBreak(description, endDate) {
	const isPomodoro = true;
	const isWebSocketHeader = true;
	const pomodoroForUser = await getPomodoroForUser();

	this.setBreakBadge(pomodoroForUser, description);

	aBrowser.storage.local.get(
		['timeEntryInProgress'],
		async ({ timeEntryInProgress }) => {
			let { projectId, task, billable, tags } = timeEntryInProgress;

			let isDefaultProjectEnabled =
				pomodoroForUser && pomodoroForUser.isDefaultProjectEnabled;
			if (isDefaultProjectEnabled) {
				//return Promise.resolve(null);
				const { defaultProject } = await DefaultProject.getStorage(isPomodoro);
				if (
					defaultProject.project.id === DefaultProjectEnums.LAST_USED_PROJECT
				) {
					// take from timeEntryInProgress, no need to get project/task from DB
				} else {
					let { projectDB, taskDB, msg, msgId } =
						await DefaultProject.getProjectTaskFromDB(isPomodoro);
					if (projectDB) {
						projectId = projectDB.id;
						task = taskDB;
					}
				}
			} else {
				// projectId = null;
				// task = null;
				// Although start-timer-component will set DeafultPoject (if defined)
			}

			const res = await TimeEntry.endInProgress({
				timeEntry: Object.assign({}, timeEntryInProgress, {
					isWebSocketHeader,
				}),
				end: endDate,
			});
			const error = res && res.error;

			//this.sendPomodoroEvent(null);
			description === 'Pomodoro break'
				? this.clearBreakNotification()
				: this.clearLongBreakNotification();

			if (error && error.status === 400) {
				const { entry: ent, error: err } =
					await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(
						timeEntryInProgress,
						new Date(),
						isWebSocketHeader
					);
				//if (!err)
				this.startBreakTimer(description, isWebSocketHeader, {
					projectId,
					task,
					billable,
					tags,
				});
			} else {
				this.startBreakTimer(description, isWebSocketHeader, {
					projectId,
					task,
					billable,
					tags,
				});
			}
		}
	);
}

async function startBreakTimer(description, isWebSocketHeader, options) {
	const isPomodoro = true;
	const { data: entry, error } = await TimeEntry.startTimer(
		description,
		Object.assign({}, options, { isWebSocketHeader }),
		isPomodoro
	);

	if (entry && entry.id) {
		//this.sendPomodoroEvent(entry);
		aBrowser.storage.local.set({
			timeEntryInProgress: entry,
		});
		const pomodoroForUser = await getPomodoroForUser();

		const pomodoroBreakLength =
			description === 'Pomodoro break'
				? pomodoroForUser.shortBreak * 60 * 1000
				: pomodoroForUser.longBreak * 60 * 1000;

		localStorage.setItem('breakIntervalProps', {
			start: entry.timeInterval.start,
			pomodoroForUser,
			pomodoroBreakLength,
			description,
		});

		aBrowser.alarms.create('breakInterval', {
			periodInMinutes: 1,
			when: Date.now() + 30000,
		});
	} else {
		aBrowser.storage.local.set({
			timeEntryInProgress: null,
		});
	}
}

async function stopTimerByPomodoro() {
	const res = await TimeEntry.endInProgress();
	const error = res && res.error;
	//this.sendPomodoroEvent(null);
	this.clearNotification('pomodoroBreak');
	this.clearNotification('pomodoroLongBreak');
	this.restartPomodoro();

	if (error && error.status === 400) {
		aBrowser.storage.local.get(['timeEntryInProgress'], async (result) => {
			const { entry: ent, error: err } =
				await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(
					result.timeEntryInProgress,
					new Date()
				);
		});
	}
	setTimeEntryInProgress(null);
	aBrowser.action.setIcon({
		path: iconPathEnded,
	});
}

async function startTimerByPomodoro() {
	const isWebSocketHeader = true;

	const res = await TimeEntry.endInProgress();
	const error = res && res.error;
	//this.sendPomodoroEvent(null);
	this.clearNotification('breakOver');

	if (error && error.status === 400) {
		aBrowser.storage.local.get(['timeEntryInProgress'], async (result) => {
			const { entry: ent, error: err } =
				await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(
					result.timeEntryInProgress,
					new Date(),
					isWebSocketHeader
				);
			//if (!err)
			this.startNewEntryTimer(isWebSocketHeader);
		});
	} else {
		this.startNewEntryTimer(isWebSocketHeader);
	}
}

async function startNewEntryTimer(isWebSocketHeader) {
	const pomodoroForUser = await getPomodoroForUser();
	this.setActiveBadge(pomodoroForUser.timerInterval);
	const { data: entry, error } = await TimeEntry.startTimer(
		'',
		isWebSocketHeader
	);

	if (entry && entry.id) {
		const pomodoroForUser = await getPomodoroForUser();
		aBrowser.storage.local.set({
			timeEntryInProgress: entry,
		});
		//this.sendPomodoroEvent(entry);

		localStorage.setItem('pomodoroIntervalProps', {
			start: entry.timeInterval.start,
			pomodoroForUser,
		});
		aBrowser.alarms.create('pomodoroInterval', {
			periodInMinutes: 1,
			when: Date.now() + 30000,
		});
	}
}

async function continueLastEntryByPomodoro(endDate) {
	const pomodoroForUser = await getPomodoroForUser();
	this.setActiveBadge(pomodoroForUser.timerInterval);

	const { entry: lastEntry, error: err } =
		await TimeEntry.getLastPomodoroEntry();
	const isWebSocketHeader = true;
	const res = await TimeEntry.endInProgress({
		timeEntry: Object.assign({}, lastEntry, { isWebSocketHeader }),
		end: endDate,
	});
	const error = res && res.error;
	this.clearNotification('breakOver');
	//this.sendPomodoroEvent(null);
	if (error && error.status === 400) {
		aBrowser.storage.local.get(['timeEntryInProgress'], async (result) => {
			const { entry: ent, error: err } =
				await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(
					result.timeEntryInProgress,
					new Date(),
					isWebSocketHeader
				);
			// if (!err)
			continueLastEntryTimer(lastEntry, isWebSocketHeader);
		});
	} else {
		continueLastEntryTimer(lastEntry, isWebSocketHeader);
	}
}

async function continueLastEntryTimer(timeEntry, isWebSocketHeader) {
	const isPomodoro = true;
	const { data: entry, error } = await TimeEntry.startTimer(
		timeEntry.description,
		{
			projectId: timeEntry.projectId,
			task: timeEntry.taskId ? { id: timeEntry.taskId } : null,
			billable: timeEntry.billable,
			tags: timeEntry.tagIds
				? timeEntry.tagIds.map((tagId) => ({ id: tagId }))
				: null,
			isWebSocketHeader,
		},
		isPomodoro
	);

	if (entry && entry.id) {
		const pomodoroForUser = await getPomodoroForUser();
		aBrowser.storage.local.set({
			timeEntryInProgress: entry,
		});
		//this.sendPomodoroEvent(entry);

		localStorage.setItem('pomodoroIntervalProps', {
			start: entry.timeInterval.start,
			pomodoroForUser,
		});
		aBrowser.alarms.create('pomodoroInterval', {
			periodInMinutes: 1,
			when: Date.now() + 30000,
		});
	}
}

function restartPomodoro() {
	this.removeAllPomodoroTimers();
	this.removeBadge();
	localStorage.setItem('breakCounter', 0);
}

// function sendPomodoroEvent(timeEntry) {
// aBrowser.runtime.sendMessage({
//     eventName: 'pomodoroEvent',
//     timeEntry: timeEntry
// });
// }
