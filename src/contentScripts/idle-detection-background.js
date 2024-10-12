const minuteInMilliseconds = 60000;
// const idleButtons = [clockifyLocales.DISCARD_IDLE_TIME, clockifyLocales.DISCARD_AND_CONTINUE];
const idleChangeStateListener = async (callback) => {
	const idleDetectionByUser = await this.getIdleDetectionByUser();
	const timeEntryInProgress = await localStorage.getItem('timeEntryInProgress');

	if (timeEntryInProgress) {
		const idleDetectedIn = await localStorage.getItem('idleDetectedIn');
		if (idleDetectionByUser && callback === 'idle') {
			localStorage.setItem(
				'idleDetectedIn',
				Date.now() -
					parseInt(idleDetectionByUser.counter) * minuteInMilliseconds
			);
			// document.idleDetectedIn = (Date.now() - parseInt(idleDetectionByUser.counter) * minuteInMilliseconds);
			this.setTimeEntryToDetectedIdleTime(timeEntryInProgress.id);
		} else if (
			idleDetectedIn &&
			parseInt(idleDetectedIn) > 0 &&
			callback === 'active' &&
			idleDetectionByUser.timeEntryId === timeEntryInProgress.id
		) {
			const idleDetectedIn = await localStorage.getItem('idleDetectedIn');
			this.createIdleNotification(timeEntryInProgress, idleDetectedIn);
		}
	}
};

// aBrowser.idle.setDetectionInterval(60);
aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);

this.setIdleDetectionOnBrowserStart();

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.eventName === 'idleDetection') {
		if (parseInt(request.counter) > 0) {
			aBrowser.idle.setDetectionInterval(parseInt(request.counter) * 60);

			aBrowser.storage.local.get(['timeEntryInProgress'], (result) => {
				if (result.timeEntryInProgress) {
					// aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);
				} else {
					if (
						idleChangeStateListener &&
						aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)
					) {
						aBrowser.idle.onStateChanged.removeListener(
							idleChangeStateListener
						);
					}
				}
			});
		} else {
			if (
				idleChangeStateListener &&
				aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)
			) {
				aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
			}
		}
	} else if (request.eventName === 'addIdleListenerIfIdleIsEnabled') {
		addIdleListenerIfIdleIsEnabled();
	} else if (request.eventName === 'removeIdleListenerIfIdleIsEnabled') {
		removeIdleListenerIfIdleIsEnabled();
	}
});

async function addIdleListenerIfIdleIsEnabled() {
	const idleDetectionByUser = await this.getIdleDetectionByUser();

	if (idleDetectionByUser && idleDetectionByUser.counter > 0) {
		aBrowser.idle.setDetectionInterval(
			parseInt(idleDetectionByUser.counter) * 60
		);
		aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);
	}
}

async function removeIdleListenerIfIdleIsEnabled() {
	const idleDetectionByUser = await this.getIdleDetectionByUser();
	if (
		idleDetectionByUser &&
		idleDetectionByUser.counter > 0 &&
		idleChangeStateListener
	) {
		aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
	}

	this.clearNotification('idleDetection');
}

async function setIdleDetectionOnBrowserStart() {
	const idleDetectionByUser = await this.getIdleDetectionByUser();

	if (idleDetectionByUser && idleDetectionByUser.counter > 0) {
		aBrowser.idle.setDetectionInterval(
			parseInt(idleDetectionByUser.counter) * 60
		);

		aBrowser.storage.local.get(['timeEntryInProgress'], (result) => {
			if (result.timeEntryInProgress) {
				aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);
			} else {
				if (
					idleChangeStateListener &&
					aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)
				) {
					aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
				}
			}
		});
	} else {
		if (
			idleChangeStateListener &&
			aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)
		) {
			aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
		}
	}
}

async function getIdleDetectionByUser() {
	const idleDetectionFromStorage = await localStorage.getItem(
		'permanent_idleDetection'
	);
	const userId = await localStorage.getItem('userId');

	return idleDetectionFromStorage
		? JSON.parse(idleDetectionFromStorage).filter(
				(idleDetectionByUser) => idleDetectionByUser.userId === userId
		  )[0]
		: null;
}

function createIdleNotification(timeEntryInProgress, idleDetectedIn) {
	const { projectId, project, task, description } = timeEntryInProgress;
	let msg = clockifyLocales.NO_DESCRIPTION;
	if (description) {
		msg = description;
		if (projectId) {
			msg += ' - ' + project.name;
			if (task) {
				msg += ':' + task.name;
			}
		}
	} else {
		if (projectId) {
			msg = project.name;
			if (task) {
				msg += ':' + task.name;
			}
		}
	}

	const idleDuration = this.getIdleDuration(idleDetectedIn);
	const buttonsForMessage = [
		{ title: clockifyLocales.DISCARD_IDLE_TIME },
		{ title: clockifyLocales.DISCARD_AND_CONTINUE },
	];

	const notificationOptions = {
		type: 'basic',
		iconUrl: './assets/icons/64x64.png',
		title: clockifyLocales.IDLE_TIME_DETECTED,
		message: this.createIdleMessage(msg, idleDuration),
	};

	if (this.isChrome()) {
		notificationOptions.buttons = buttonsForMessage;
		notificationOptions.requireInteraction = true;
	} else {
		notificationOptions.message =
			notificationOptions.message +
			' ' +
			clockifyLocales.CLICK_HERE_TO_DISCARD_IDLE;
	}
	this.createNotification('idleDetection', notificationOptions);
}

function getIdleDuration(idleDetectedIn) {
	const currentTime = Date.now();
	let idleDuration;
	let idleDurationHours = 0;
	let idleDurationMinutes = parseInt(
		((currentTime - idleDetectedIn) / minuteInMilliseconds)
			.toString()
			.split('.')[0]
	);

	if (idleDurationMinutes >= 60) {
		if (idleDurationMinutes % 60 > 0) {
			idleDurationMinutes = idleDurationMinutes % 60;
			idleDurationHours =
				(idleDurationMinutes - (idleDurationMinutes % 60)) / 60;
		} else {
			idleDurationHours = idleDurationMinutes / 60;
			idleDurationMinutes = 0;
		}
	}

	idleDuration = {
		hours: idleDurationHours,
		minutes: idleDurationMinutes,
	};

	return idleDuration;
}

function createIdleMessage(description, idleDuration) {
	// let message = "You've been inactive for ";
	// if (idleDuration.hours > 0) {
	//     message += idleDuration.minutes + "h ";
	// }
	// message += idleDuration.minutes + "m while tracking ";

	// if (!!description) {
	//     message += "'" + description + "'";
	// } else {
	//     message += clockifyLocales.NO_DESCRIPTION;
	// }

	if (description) {
		description = "'" + description + "'";
	} else {
		description = clockifyLocales.NO_DESCRIPTION;
	}

	return idleDuration.hours > 0
		? clockifyLocales.IDLE_MESSAGE(
				idleDuration.hours,
				idleDuration.minutes,
				description
		  )
		: clockifyLocales.IDLE_MESSAGE_MINUTES(idleDuration.minutes, description);
}

async function discardIdleTimeAndStopEntry() {
	const { entry, error } = await TimeEntry.getEntryInProgress();
	if (error) {
	} else if (entry) {
		const idleDetectedIn = await localStorage.getItem('idleDetectedIn');
		const { error } = await TimeEntry.endInProgress({
			timeEntry: entry,
			end: new Date(idleDetectedIn),
		});
		this.clearNotification('idleDetection');

		if (error && error.status == 400) {
			await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(
				entry,
				idleDetectedIn
			);
		}

		aBrowser.runtime.sendMessage({
			eventName: 'idleEvent',
			timeEntry: null,
		});
		setTimeEntryInProgress(null);
	}
}

async function discardIdleTimeAndContinueEntry() {
	const { entry, error } = await TimeEntry.getEntryInProgress();
	if (error) {
	} else if (entry) {
		const idleDetectedIn = await localStorage.getItem('idleDetectedIn');
		const { error } = await TimeEntry.endInProgress({
			timeEntry: entry,
			end: new Date(idleDetectedIn),
		});
		this.clearNotification('idleDetection');

		if (error && error.status == 400) {
			await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(
				entry,
				idleDetectedIn
			);
		}

		setTimeEntryInProgress(null);
		aBrowser.runtime.sendMessage({
			eventName: 'idleEvent',
			timeEntry: null,
		});

		if (error && error.status == 400) {
			return;
		}

		aBrowser.runtime.sendMessage({
			eventName: 'idleEvent',
			timeEntry: {}, // just to call this.start.getTimeEntryInProgress()
		});

		TimeEntry.startTimer(entry.description, {
			projectId: entry.projectId,
			billable: entry.billable,
			task: entry.taskId ? { id: entry.taskId } : null,
			tags: entry.tagIds ? entry.tagIds.map((tagId) => ({ id: tagId })) : null,
		});
	}
}

async function setTimeEntryToDetectedIdleTime(timeEntryId) {
	const userId = await localStorage.getItem('userId');
	const idleDetectionToSaveInStorage = JSON.parse(
		await localStorage.getItem('permanent_idleDetection')
	).map((idleDetection) => {
		if (idleDetection.userId === userId) {
			idleDetection.timeEntryId = timeEntryId;
		}

		return idleDetection;
	});

	localStorage.setItem(
		'permanent_idleDetection',
		JSON.stringify(idleDetectionToSaveInStorage)
	);
}
