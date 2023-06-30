function parseTimesToDates(time) {
	const hours = parseInt(time.split(':')[0]);
	const minutes = parseInt(time.split(':')[1]);

	return new Date(
		new Date().getFullYear(),
		new Date().getMonth(),
		new Date().getDate(),
		hours,
		minutes,
		0
	);
}

aBrowser.alarms.onAlarm.addListener(async (alarm) => {
	if (alarm.name === 'stopEntryInProgress' && windowIds.length > 0) {
		//prevents chrome from executing alarm when user opens browser way after timer was set
		if(alarm.scheduledTime > Date.now() - 60000){
			TimeEntry.endInProgress();
		}
	}
});

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.eventName === 'createStopTimerEvent') {
		removeStopTimerEvent();
		aBrowser.storage.local.get(['userId']).then((user) => {
			aBrowser.storage.local
				.get('permanent_stopTimerOnSelectedTime')
				.then((res) => {
					const { permanent_stopTimerOnSelectedTime: stopTimerOnSelectedTime } =
						res;
					if (stopTimerOnSelectedTime) {
						let stopTimerOnSelectedTimeForCurrentUser = JSON.parse(
							stopTimerOnSelectedTime
						).find((stopTimer) => stopTimer.userId === user.userId);
						if (stopTimerOnSelectedTimeForCurrentUser) {
							if (stopTimerOnSelectedTimeForCurrentUser.enabled === true) {
								const dateTo = parseTimesToDates(
									stopTimerOnSelectedTimeForCurrentUser.time
								);
								const currentDate = new Date();
								if (dateTo > currentDate) {
									stopTimerEvent = aBrowser.alarms.create(
										'stopEntryInProgress',
										{
											when: dateTo.getTime(),
										}
									);
								} else {
									//stop timer for next day
									stopTimerEvent = aBrowser.alarms.create(
										'stopEntryInProgress',
										{
											when: dateTo.getTime() + 86400000,
										}
									);
								}
							}
						}
					}
				});
		});
	}

	if (request.eventName === 'removeStopTimerEvent') {
		removeStopTimerEvent();
	}
});

function removeStopTimerEvent() {
	aBrowser.alarms.clear('stopEntryInProgress');
}
