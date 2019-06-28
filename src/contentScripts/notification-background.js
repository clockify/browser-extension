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
            if (reminderButtons[buttonIndex] === 'Start timer') {
                this.startTimer('');
                this.removeReminderTimer();
            } else {
                aBrowser.tabs.create({'url': 'https://clockify.me/tracker?mode=manual'});
                this.removeReminderTimer();
                this.addReminderTimer();
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
            this.discardIdleTimeAndStopEntry();
            break;
        case 'reminder' :
            this.removeReminderTimer();
            this.addReminderTimer();
            break;
    }
};

function createNotification(notificationId, notificationOptions) {
    aBrowser.notifications.create(notificationId, notificationOptions, (callback) => {
        if (this.isChrome()) {
            aBrowser.notifications.onButtonClicked.addListener(buttonClickedListener);
        } else {
            aBrowser.notifications.onClicked.addListener(notificationClickedListener);
        }
        aBrowser.notifications.onClosed.addListener(notificationClosedListener);
    });
}

function clearNotification(notificationId) {
    try {
        aBrowser.notification.clear(notificationId);
    } catch (e) {}
}