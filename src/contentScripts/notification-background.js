
const buttonClickedListener = (notificationId, buttonIndex) => {
    switch (notificationId) {
        case 'idleDetection':
            if (idleButtons[buttonIndex] === 'Discard idle time') {
                this.discardIdleTimeAndStopEntry();
            } else {
                this.discardIdleTimeAndContinueEntry();
            }
            break;
        case 'reminder':
            if (reminderButtons[buttonIndex] === clockifyLocales.START_TIMER) {
                TimeEntry.startTimer('');
                this.removeReminderTimer();
            } else {
                aBrowser.tabs.create({'url': 'https://app.clockify.me/tracker?mode=manual'});
                this.removeReminderTimer();
                this.addReminderTimer();
            }
            break;
        case 'pomodoroBreak':
            if (breakButtons[buttonIndex] === clockifyLocales.STOP_TIMER) {
                this.stopTimerByPomodoro();
            } else if (breakButtons[buttonIndex] === 'Start break') {
                this.startBreak('Pomodoro break');
            }
            break;
        case 'pomodoroLongBreak':
            if (longBreakButtons[buttonIndex] === clockifyLocales.STOP_TIMER) {
                this.stopTimerByPomodoro();
            } else {
                this.startBreak('Pomodoro long break');
            }
            break;
        case 'breakOver':
            if (breakOverButtons[buttonIndex] === clockifyLocales.START_TIMER) {
                this.startTimerByPomodoro();
            } else {
                this.continueLastEntryByPomodoro();
            }
            break;
    }
};

const notificationClosedListener = (notificationId) => {
    switch (notificationId) {
        case 'idleDetection' :
            idleDetectedIn = 0;
            break;
        case 'reminder' :
            this.removeReminderTimer();
            this.addReminderTimer();
            break;
    }
};

const notificationClickedListener = (notificationId) => {
    switch (notificationId) {
        case 'idleDetection' :
            if (!this.isChrome()) {
                this.discardIdleTimeAndStopEntry();
            }
            break;
        case 'reminder' :
            if (!this.isChrome()) {
                this.removeReminderTimer();
                this.addReminderTimer();
            }
            break;
        case 'pomodoroBreak':
            if (!this.isChrome()) {
                this.startBreak('Pomodoro break');
            }
            break;
        case 'pomodoroLongBreak':
            if (!this.isChrome()) {
                this.startBreak('Pomodoro long break');
            }
            break;
        case 'breakOver':
            if (!this.isChrome()) {
                this.continueLastEntryByPomodoro();
            }
            break;
        case 'pomodoroBreakNotify':
            this.clearNotification('pomodoroBreakNotify');
            break;
        case 'pomodoroBreakOverNotify':
            this.clearNotification('pomodoroBreakOverNotify');
            break;
    }
};

aBrowser.notifications.onButtonClicked.addListener(buttonClickedListener);
aBrowser.notifications.onClicked.addListener(notificationClickedListener);
aBrowser.notifications.onClosed.addListener(notificationClosedListener);

function createNotification(notificationId, notificationOptions, isAudioOn) {
    aBrowser.notifications.create(notificationId, notificationOptions, (callback) => {
        
    });

    if (isAudioOn) {
        this.audioNotification();
    }
}

function audioNotification() {
    // TODO: Add audio support for service workers
    // const audio = new Audio('../assets/audio/pomodoro-notification.ogg');
    // audio.play();
    // aBrowser.runtime.sendMessage({eventName: 'settingsPlayAudio'});
}

function clearNotification(notificationId) {
    try {
        aBrowser.notifications.clear(notificationId);
    } catch (e) {
    }
}