let pomodoroTimer;
let breakTimer;
let breakCounter = 0;
const breakButtons = ['Stop timer', 'Start break'];
const longBreakButtons = ['Stop timer', 'Start long break'];
const breakOverButtons = ['Start timer', 'Continue last'];

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'pomodoroTimer') {
        this.addPomodoroTimer();
    }
});

function addPomodoroTimer() {
    const userId = localStorage.getItem('userId');
    const pomodoroForUser = localStorage.getItem('permanent_pomodoro') ?
        JSON.parse(localStorage.getItem('permanent_pomodoro')).filter(pomodoro => pomodoro.userId === userId)[0] :
        null;

    if (pomodoroForUser && pomodoroForUser.enabled) {
        this.getEntryInProgress().then(response => response.json()).then(data => {
            document.timeEntry = data;
            const currDate = new Date();
            const start = new Date(data.timeInterval.start);
            const diff = currDate.getTime() - start.getTime();

            if (data.description === 'Pomodoro break' || data.description === 'Pomodoro long break') {
                return;
            }

            if (diff >= pomodoroForUser.timerInterval * 60 * 1000) {
                if (pomodoroForUser.isAutomaticStartStop) {
                    this.startBreakAndNotify("Pomodoro break", pomodoroForUser);
                } else {
                    this.createBreakNotification(pomodoroForUser);
                }
                return;
            }

            pomodoroTimer = setTimeout(() => {
                if (pomodoroForUser.isAutomaticStartStop) {
                    this.startBreakAndNotify("Pomodoro break", pomodoroForUser);
                } else {
                    this.createBreakNotification(pomodoroForUser);
                }
            }, pomodoroForUser.timerInterval * 60 * 1000);
        }).catch();
    }
}

function removePomodoroTimer() {
    if (pomodoroTimer) {
        clearTimeout(pomodoroTimer);
    }
}

function removeBreakTimer() {
    if (breakTimer) {
        clearTimeout(breakTimer);
    }
}

function clearTimeoutForRemovingNotification(notificationId, timeout) {
    const clearTimeout = setTimeout(() => {
        this.clearNotification(notificationId);
        this.clearTimeout(clearTimeout);
    }, timeout * 60 * 1000);
}

function removeAllPomodoroTimers() {
    this.removePomodoroTimer();
    this.removeBreakTimer();
    this.clearBreakOverNotification();
    this.clearBreakNotification();
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

function startBreakAndNotify(description, pomodoroForUser) {
    this.removePomodoroTimer();
    this.startBreak(description);

    this.notifyAboutStartingBrake(description, pomodoroForUser);
}

function continueLastEntryAndNotify(pomodoroForUser) {
    this.continueLastEntryByPomodoro();

    this.notifyThatBreakIsOver(pomodoroForUser);
}

function notifyAboutStartingBrake(description, pomodoroForUser) {
    const breakMinutes = description === 'Pomodoro break' ? pomodoroForUser.shortBreak : pomodoroForUser.longBreak;

    const notificationOptions = {
        type: "basic",
        iconUrl: "./assets/icons/64x64.png",
        title: "Pomodoro timer",
        message: "Your " + breakMinutes + "-minute break has started."
    };

    this.createNotification('pomodoroBreakNotify', notificationOptions, pomodoroForUser.isSoundNotification);
    this.clearTimeoutForRemovingNotification('pomodoroBreakNotify', 10);
}

function notifyThatBreakIsOver(pomodoroForUser) {
    const notificationOptions = {
        type: "basic",
        iconUrl: "./assets/icons/64x64.png",
        title: "Pomodoro timer",
        message: "Your break has ended. Work timer resumed."
    };

    this.createNotification('pomodoroBreakOverNotify', notificationOptions, pomodoroForUser.isSoundNotification);
    this.clearTimeoutForRemovingNotification('pomodoroBreakOverNotify', 10);
}

function createBreakNotification(pomodoroForUser) {
    this.removePomodoroTimer();

    const buttonsForMessage = [
        {title: breakButtons[0]},
        {title: breakButtons[1]}
    ];

    const notificationOptions = {
        type: "basic",
        iconUrl: "./assets/icons/64x64.png",
        title: "Pomodoro timer",
        message: "You've been working " + pomodoroForUser.timerInterval + " minutes. Time to take a break!"
    };

    if (this.isChrome()) {
        notificationOptions.buttons = buttonsForMessage;
        notificationOptions.requireInteraction = true;
    } else {
        notificationOptions.message = notificationOptions.message + " Click here to start the break."
    }

    if (pomodoroForUser.isLongBreakEnabled) {
        notificationOptions.message = notificationOptions.message + " (Session " + (breakCounter + 1) + ")."
    }

    this.createNotification('pomodoroBreak', notificationOptions, pomodoroForUser.isSoundNotification);
}

function createBreakOverNotification() {
    this.removeBreakTimer();

    const buttonsForMessage = [
        {title: breakOverButtons[0]},
        {title: breakOverButtons[1]}
    ];

    const notificationOptions = {
        type: "basic",
        iconUrl: "./assets/icons/64x64.png",
        title: "Pomodoro timer",
        message: "Break over. Time to work!"
    };

    if (this.isChrome()) {
        notificationOptions.buttons = buttonsForMessage;
        notificationOptions.requireInteraction = true;
    } else {
        notificationOptions.message = notificationOptions.message + " Click here to start timer."
    }

    this.createNotification('breakOver', notificationOptions);
}

function createLongBreakNotification(pomodoroForUser) {
    this.removePomodoroTimer();

    const buttonsForMessage = [
        {title: longBreakButtons[0]},
        {title: longBreakButtons[1]}
    ];

    const notificationOptions = {
        type: "basic",
        iconUrl: "./assets/icons/64x64.png",
        title: "Pomodoro timer",
        message: "You've been working " + pomodoroForUser.timerInterval + " minutes. Time to take the long break!"
    };

    if (this.isChrome()) {
        notificationOptions.buttons = buttonsForMessage;
        notificationOptions.requireInteraction = true;
    } else {
        notificationOptions.message = notificationOptions.message + " Click here to start the long break."
    }

    this.createNotification('pomodoroLongBreak', notificationOptions, pomodoroForUser.isSoundNotification);
}

function startBreak(description) {
    const isWebSocketHeader = true;
    this.endInProgress(new Date(), isWebSocketHeader).then((response) => {
        this.sendPomodoroEvent(null);
        description === 'Pomodoro break' ?
            this.clearBreakNotification() : this.clearLongBreakNotification();

        if (response.status === 400) {
            this.saveEntryOfflineAndStopItByDeletingIt(document.timeEntry, new Date(), isWebSocketHeader)
                .then(response => {
                    this.startBreakTimer(description, isWebSocketHeader);
                });
            return;
        } else {
            this.startBreakTimer(description, isWebSocketHeader);
        }
    });
}

function startBreakTimer(description, isWebSocketHeader) {
    this.startTimer(
        description,
        {
            projectId: null,
            taskId: null,
            billable: false,
            tagIds: null,
            isWebSocketHeader: isWebSocketHeader
        }
    ).then(response => {
        if (response && response.id) {
            this.sendPomodoroEvent(response);
            document.timeEntry = response;
            const userId = localStorage.getItem('userId');
            const pomodoroForUser = localStorage.getItem('permanent_pomodoro') ?
                JSON.parse(localStorage.getItem('permanent_pomodoro'))
                    .filter(pomodoro => pomodoro.userId === userId)[0] :
                null;

            breakTimer = setTimeout(() => {
                if (pomodoroForUser.isAutomaticStartStop) {
                    this.continueLastEntryAndNotify(pomodoroForUser);
                } else {
                    this.createBreakOverNotification();
                }
                description === 'Pomodoro break' && pomodoroForUser.isLongBreakEnabled ?
                    breakCounter++ : breakCounter = 0;

            }, description === 'Pomodoro break' ?
                pomodoroForUser.shortBreak * 60 * 1000 : pomodoroForUser.longBreak * 60 * 1000);
        }
    });
}

function stopTimerByPomodoro() {
    const isWebSocketHeader = true;
    this.endInProgress(new Date(), isWebSocketHeader).then((response) => {
        this.sendPomodoroEvent(null);
        this.clearNotification('pomodoroBreak');
        this.clearNotification('pomodoroLongBreak');
        this.restartPomodoro();

        if(response.status === 400) {
            this.saveEntryOfflineAndStopItByDeletingIt(document.timeEntry, new Date());
        }

        document.timeEntry = null;
        this.entryInProgressChangedEventHandler(null);
        aBrowser.browserAction.setIcon({
            path: iconPathEnded
        });
    });
}

function startTimerByPomodoro() {
    const isWebSocketHeader = true;
    this.endInProgress(new Date(), isWebSocketHeader).then((response) => {
        this.sendPomodoroEvent(null);
        this.clearNotification('breakOver');

        if (response.status === 400) {
            this.saveEntryOfflineAndStopItByDeletingIt(document.timeEntry, new Date(), isWebSocketHeader)
                .then(response => this.startNewEntryTimer(isWebSocketHeader));
            return;
        } else {
            this.startNewEntryTimer(isWebSocketHeader);
        }
    });
}

function startNewEntryTimer(isWebSocketHeader) {
    this.startTimer(
        '',
        {
            projectId: null,
            taskId: null,
            billable: false,
            tagIds: null,
            isWebSocketHeader: isWebSocketHeader
        }
    ).then(response => {
        if (response && response.id) {
            document.timeEntry = response;
            this.sendPomodoroEvent(response);
            const userId = localStorage.getItem('userId');
            const pomodoroForUser = localStorage.getItem('permanent_pomodoro') ?
                JSON.parse(localStorage.getItem('permanent_pomodoro'))
                    .filter(pomodoro => pomodoro.userId === userId)[0] :
                null;

            pomodoroTimer = setTimeout(() => {
                if (pomodoroForUser.isLongBreakEnabled && breakCounter === pomodoroForUser.breakCounter) {
                    this.createLongBreakNotification(pomodoroForUser);
                } else {
                    this.createBreakNotification(pomodoroForUser);
                }
            }, pomodoroForUser.timerInterval * 60 * 1000);
        }
    });
}

function continueLastEntryByPomodoro() {
    this.getLastEntry().then(entry => {
        const isWebSocketHeader = true;
        this.endInProgress(new Date(), isWebSocketHeader).then((response) => {
            this.clearNotification('breakOver');
            this.sendPomodoroEvent(null);
            if (response.status === 400) {
                this.saveEntryOfflineAndStopItByDeletingIt(document.timeEntry, new Date(), isWebSocketHeader)
                    .then(response => this.continueLastEntryTimer(entry, isWebSocketHeader));
            } else {
                this.continueLastEntryTimer(entry, isWebSocketHeader);
            }
        });
    });
}

function continueLastEntryTimer(entry, isWebSocketHeader) {
    this.startTimer(
        entry.description,
        {
            projectId: entry.projectId,
            taskId: entry.taskId,
            billable: entry.billable,
            tagIds: entry.tagIds,
            isWebSocketHeader: isWebSocketHeader
        }
    ).then(response => {
        if (response && response.id) {
            document.timeEntry = response;
            this.sendPomodoroEvent(response);
            const userId = localStorage.getItem('userId');
            const pomodoroForUser = localStorage.getItem('permanent_pomodoro') ?
                JSON.parse(localStorage.getItem('permanent_pomodoro'))
                    .filter(pomodoro => pomodoro.userId === userId)[0] :
                null;

            pomodoroTimer = setTimeout(() => {
                if (pomodoroForUser.isLongBreakEnabled && breakCounter === pomodoroForUser.breakCounter) {
                    if (pomodoroForUser.isAutomaticStartStop) {
                        this.startBreakAndNotify('Pomodoro long break', pomodoroForUser);
                    } else {
                        this.createLongBreakNotification(pomodoroForUser);
                    }
                } else {
                    if (pomodoroForUser.isAutomaticStartStop) {
                        this.startBreakAndNotify('Pomodoro break', pomodoroForUser);
                    } else {
                        this.createBreakNotification(pomodoroForUser);
                    }
                }
            }, pomodoroForUser.timerInterval * 60 * 1000);
        }
    });
}

function restartPomodoro() {
    this.removeAllPomodoroTimers();
    breakCounter = 0;
}

function sendPomodoroEvent(timeEntry) {
    aBrowser.runtime.sendMessage({
        eventName: "pomodoroEvent",
        timeEntry: timeEntry
    });
}

