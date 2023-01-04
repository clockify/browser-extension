let reminderTimer;
// const reminderButtons = [clockifyLocales.START_TIMER, clockifyLocales.ADD_MISSING_TIME];

aBrowser.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name === 'createReminderNotification') {
		const userId = await localStorage.getItem('userId');
		const permReminderDandT = await localStorage.getItem(
			'permanent_reminderDatesAndTimes'
		);
		const reminderByUserFromStorage = JSON.parse(permReminderDandT).filter(
			(reminderDatesAndTime) => reminderDatesAndTime.userId === userId
		)[0];
		const dateTo = this.parseTimesToDates(reminderByUserFromStorage.timeTo);
		createReminderNotification(
			dateTo,
			reminderByUserFromStorage.minutesSinceLastEntry
		);
	}
});

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	aBrowser.storage.local.get(['timeEntryInProgress'], (result) => {
		if (request.eventName === 'reminder' && !result.timeEntryInProgress) {
			addReminderTimer();
		}
	});

	if (request.eventName === 'removeReminderTimer') {
		removeReminderTimer();
	}
});

async function addReminderTimer() {
	const userId = await localStorage.getItem('userId');
	const permReminder = await localStorage.getItem('permanent_reminders');
	const reminderEnabledForUser = permReminder
		? JSON.parse(permReminder).filter(
				(reminder) => reminder.userId === userId
		  )[0]
		: null;

	if (!reminderEnabledForUser || !reminderEnabledForUser.enabled) {
		return;
	}
	const permReminderDandT = await localStorage.getItem(
		'permanent_reminderDatesAndTimes'
	);
	const reminderByUserFromStorage = JSON.parse(permReminderDandT).filter(
		(reminderDatesAndTime) => reminderDatesAndTime.userId === userId
	)[0];
	const currentDate = new Date();
	const dateFrom = this.parseTimesToDates(reminderByUserFromStorage.timeFrom);
	const dateTo = this.parseTimesToDates(reminderByUserFromStorage.timeTo);

	if (
		dateFrom < currentDate.getTime() &&
		currentDate.getTime() < dateTo &&
		reminderByUserFromStorage.dates.includes(currentDate.getDay())
	) {
		aBrowser.alarms.create('createReminderNotification', {
			delayInMinutes: reminderByUserFromStorage.minutesSinceLastEntry,
		});

		// reminderTimer = setTimeout(
		//     () => this.createReminderNotification(dateTo, reminderByUserFromStorage.minutesSinceLastEntry),
		//     reminderByUserFromStorage.minutesSinceLastEntry * 60 * 1000);
	}
}

function removeReminderTimer() {
	if (reminderTimer) {
		// clearTimeout(reminderTimer);
		aBrowser.alarms.clear('createReminderNotification');
	}
	this.clearNotification('reminder');
}

function parseTimesToDates(time) {
	const hourFrom = parseInt(time.split(':')[0]);
	const minutesFrom = parseInt(time.split(':')[1]);

	return new Date(
		new Date().getFullYear(),
		new Date().getMonth(),
		new Date().getDate(),
		hourFrom,
		minutesFrom,
		0
	);
}

function createReminderNotification(dateTo, minutes) {
	const currentTime = new Date().getTime();

	aBrowser.storage.local.get(['timeEntryInProgress'], (result) => {
		if (currentTime > dateTo || result.timeEntryInProgress) {
			this.removeReminderTimer();
			return;
		} else {
			const buttonsForMessage = [
				{ title: clockifyLocales.START_TIMER },
				{ title: clockifyLocales.ADD_MISSING_TIME },
			];

			const notificationOptions = {
				type: 'basic',
				iconUrl: './assets/icons/64x64.png',
				title: clockifyLocales.REMINDER,
				// message: "Don't forget to track your time! (" + minutes + "m passed since the last activity)"
				message: clockifyLocales.REMINDER_MESSAGE(minutes),
			};

			if (this.isChrome()) {
				notificationOptions.buttons = buttonsForMessage;
				notificationOptions.requireInteraction = true;
			}

			this.createNotification('reminder', notificationOptions);
		}
	});
}

function addReminderTimerOnStartingBrowser() {
	this.removeReminderTimer();
	this.addReminderTimer();
}
