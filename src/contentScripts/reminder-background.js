let reminderTimer;
const reminderButtons = ['Start timer', 'Add missing time'];

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'reminder') {
        this.addReminderTimer();
    }
});

function addReminderTimer() {
    this.getEntryInProgress()
        .then(response => response.json())
        .then(data => {})
        .catch(() => {
            const userId = localStorage.getItem('userId');
            const reminderEnabledForUser = localStorage.getItem('permanent_reminders') ?
                JSON.parse(localStorage.getItem('permanent_reminders')).filter(reminder => reminder.userId === userId)[0] :
                null;

            if (!reminderEnabledForUser || !reminderEnabledForUser.enabled) {
                return;
            }

            const reminderByUserFromStorage =
                JSON.parse(localStorage.getItem('permanent_reminderDatesAndTimes'))
                    .filter(reminderDatesAndTime => reminderDatesAndTime.userId === userId)[0];
            const currentDate = new Date();
            const dateFrom = this.parseTimesToDates(reminderByUserFromStorage.timeFrom);
            const dateTo = this.parseTimesToDates(reminderByUserFromStorage.timeTo);


            if (
                dateFrom < currentDate.getTime() &&
                currentDate.getTime() < dateTo &&
                reminderByUserFromStorage.dates.includes(currentDate.getDay())
            ) {
                reminderTimer = setTimeout(
                    () => this.createReminderNotification(dateTo, reminderByUserFromStorage.minutesSinceLastEntry),
                    reminderByUserFromStorage.minutesSinceLastEntry * 60 * 1000);
            }
        });
}

function removeReminderTimer() {
    if (reminderTimer) {
        clearTimeout(reminderTimer);
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
    this.getEntryInProgress()
        .then(response => response.json())
        .then(data => {
            this.removeReminderTimer();
        })
        .catch(() => {});

}

function addReminderTimerOnStartingBrowser() {
    this.removeReminderTimer();
    this.addReminderTimer();
}
