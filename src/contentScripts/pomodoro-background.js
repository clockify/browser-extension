let pomodoroInterval;
let breakInterval;
let breakCounter = 0;
const breakButtons = ['Stop timer', 'Start break'];
const longBreakButtons = ['Stop timer', 'Start long break'];
const breakOverButtons = ['Start timer', 'Continue last'];

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'pomodoroTimer') {
        this.addPomodoroTimer();
    }
});


function getPomodoroForUser() {
    const userId = localStorage.getItem('userId');
    const permanent_pomodoro = localStorage.getItem('permanent_pomodoro');
    return permanent_pomodoro 
        ? JSON.parse(permanent_pomodoro).find(item => item.userId === userId)
        : null;
}

async function addPomodoroTimer() {
    const userId = localStorage.getItem('userId');
    const str = localStorage.getItem('permanent_pomodoro');
    const pomodoroForUser = str
        ? JSON.parse(str).find(pomodoro => pomodoro.userId === userId)
        : false;

    if (pomodoroForUser && pomodoroForUser.enabled) {
        let { entry, error } = await TimeEntry.getEntryInProgress();
        if (error)
            entry = null;

        aBrowser.storage.local.set({
            timeEntryInProgress: entry
        });

        if (!entry)
            return;

        const start = new Date(entry.timeInterval.start);
        let diff;

        if (entry.description === 'Pomodoro break' || entry.description === 'Pomodoro long break') {
            this.removeBreakInterval();
            const pomodoroBreakLength = entry.description === 'Pomodoro break' ?
                pomodoroForUser.shortBreak * 60 * 1000 : pomodoroForUser.longBreak * 60 * 1000;

            breakInterval = setInterval(() => {
                const currDate = new Date();
                diff = currDate.getTime() - start.getTime();
                if (diff >= pomodoroBreakLength) {
                    if (pomodoroForUser.isAutomaticStartStop) {
                        this.continueLastEntryAndNotify(pomodoroForUser);
                    } else {
                        this.createBreakOverNotification(pomodoroForUser);
                    }
                    entry.description === 'Pomodoro break' && pomodoroForUser.isLongBreakEnabled ?
                        breakCounter++ : breakCounter = 0;
                }
            }, 1000);
        } else {
            this.removePomodoroInterval();
            pomodoroInterval = setInterval(() => {
                const currDate = new Date();
                diff = currDate.getTime() - start.getTime();
                if (diff >= pomodoroForUser.timerInterval * 60 * 1000) {
                    if (pomodoroForUser.isAutomaticStartStop) {
                        this.startBreakAndNotify("Pomodoro break", pomodoroForUser);
                    } else {
                        if (pomodoroForUser.isLongBreakEnabled && breakCounter === pomodoroForUser.breakCounter) {
                            this.createLongBreakNotification(pomodoroForUser);
                        } else {
                            this.createBreakNotification(pomodoroForUser);
                        }
                    }
                }
            }, 1000);
        }
    }
}

function removePomodoroInterval() {
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
    }
}

function removeBreakInterval() {
    if (breakInterval) {
        clearInterval(breakInterval);
    }
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

async function startBreakAndNotify(description, pomodoroForUser) {
    this.removePomodoroInterval();
    await this.startBreak(description);

    this.notifyAboutStartingBrake(description, pomodoroForUser);
}

function continueLastEntryAndNotify(pomodoroForUser) {
    this.removeBreakInterval();
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
    this.removePomodoroInterval();

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

function createBreakOverNotification(pomodoroForUser) {
    this.removeBreakInterval();

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

    this.createNotification('breakOver', notificationOptions, pomodoroForUser.isSoundNotification);
}

function createLongBreakNotification(pomodoroForUser) {
    this.removePomodoroInterval();

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

async function startBreak(description) {
    const isPomodoro = true;
    const isWebSocketHeader = true;
    const pomodoroForUser = getPomodoroForUser();

    const timeEntryInProgress = JSON.parse(localStorage.getItem('timeEntryInProgress'));
    let { projectId, task, billable, tags } = timeEntryInProgress;

    let isDefaultProjectEnabled = pomodoroForUser && pomodoroForUser.isDefaultProjectEnabled;
    if (isDefaultProjectEnabled) {
        //return Promise.resolve(null);
        const { defaultProject } = DefaultProject.getStorage(isPomodoro);
        if (defaultProject.project.id === DefaultProjectEnums.LAST_USED_PROJECT) {
            // take from timeEntryInProgress, no need to get project/task from DB
        }
        else {
            let { projectDB, taskDB, msg, msgId } = await DefaultProject.getProjectTaskFromDB(isPomodoro);
            if (projectDB) {
                projectId = projectDB.id;
                task = taskDB;
            }
        }        
    }
    else {
        projectId = null;
        task = null;
        // Although start-timer-component will set DeafultPoject (if defined)
    }

    const { error } = await TimeEntry.endInProgress(Object.assign(timeEntryInProgress, {isWebSocketHeader}));

    this.sendPomodoroEvent(null);
    description === 'Pomodoro break' 
        ? this.clearBreakNotification() : this.clearLongBreakNotification();

    if (error && error.status === 400) {
        aBrowser.storage.local.get(["timeEntryInProgress"], async (result) => {
            const {entry: ent, error: err} = 
                await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(result.timeEntryInProgress, new Date(), isWebSocketHeader);
            //if (!err)
            startBreakTimer(description, isWebSocketHeader,
                { projectId, task, billable, tags });
        });
    } else {
        startBreakTimer(description, isWebSocketHeader,
            { projectId, task, billable, tags });
    }
}


async function startBreakTimer(description, isWebSocketHeader, options) {
    const isPomodoro = true;
    const { entry, error } = await TimeEntry.startTimer(
                    description, 
                    Object.assign(options, {isWebSocketHeader}), 
                    isPomodoro
                );

    if (entry && entry.id) {
        this.sendPomodoroEvent(entry);
        aBrowser.storage.local.set({
            timeEntryInProgress: entry
        });
        const pomodoroForUser = getPomodoroForUser();
        const start = new Date(entry.timeInterval.start);
        const pomodoroBreakLength = description === 'Pomodoro break' ?
            pomodoroForUser.shortBreak * 60 * 1000 : pomodoroForUser.longBreak * 60 * 1000;

        breakInterval = setInterval(() => {
            const currDate = new Date();
            const diff = currDate.getTime() - start.getTime();
            if (diff >= pomodoroBreakLength) {
                if (pomodoroForUser.isAutomaticStartStop) {
                    this.continueLastEntryAndNotify(pomodoroForUser);
                } else {
                    this.createBreakOverNotification(pomodoroForUser);
                }
                description === 'Pomodoro break' && pomodoroForUser.isLongBreakEnabled ?
                    breakCounter++ : breakCounter = 0;
            }
        }, 1000);
    }
    else {
        aBrowser.storage.local.set({
            timeEntryInProgress: null
        });
    }
}

async function stopTimerByPomodoro() {
    const isWebSocketHeader = true;

    const { error } = await TimeEntry.endInProgress();
    this.sendPomodoroEvent(null);
    this.clearNotification('pomodoroBreak');
    this.clearNotification('pomodoroLongBreak');
    this.restartPomodoro();

    if(error && error.status === 400) {
        aBrowser.storage.local.get(["timeEntryInProgress"], async (result) => {
            const {entry: ent, error: err} = 
                await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(result.timeEntryInProgress, new Date());
        });
    }
    setTimeEntryInProgress(null);
    aBrowser.browserAction.setIcon({
        path: iconPathEnded
    });
}


async function startTimerByPomodoro() {
    const isWebSocketHeader = true;

    const { error } = await TimeEntry.endInProgress();
    this.sendPomodoroEvent(null);
    this.clearNotification('breakOver');

    if (error && error.status === 400) {
        aBrowser.storage.local.get(["timeEntryInProgress"], async (result) => {
            const {entry: ent, error: err} = 
                await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(result.timeEntryInProgress, new Date(), isWebSocketHeader);
            //if (!err)
            this.startNewEntryTimer(isWebSocketHeader);
        });
    } 
    else {
        this.startNewEntryTimer(isWebSocketHeader);
    }
}

async function startNewEntryTimer(isWebSocketHeader) {
    const isPomodoro = true;
    const { entry, error } = await TimeEntry.startTimer(
        '', 
        isWebSocketHeader,
        isPomodoro
    );

    if (entry && entry.id) {
        const pomodoroForUser = getPomodoroForUser();
        aBrowser.storage.local.set({ // TODO ?
            timeEntryInProgress: entry
        });
        this.sendPomodoroEvent(entry);
        const start = new Date(entry.timeInterval.start);

        pomodoroInterval = setInterval(() => {
            const currDate = new Date();
            const diff = currDate.getTime() - start.getTime();
            if (diff >= pomodoroForUser.timerInterval * 60 * 1000) {
                if (pomodoroForUser.isLongBreakEnabled && breakCounter === pomodoroForUser.breakCounter) {
                    this.createLongBreakNotification(pomodoroForUser);
                } else {
                    this.createBreakNotification(pomodoroForUser);
                }
            }
        }, 1000);
    }
}

async function continueLastEntryByPomodoro() {
    const { entry: lastEntry, error: err } = await TimeEntry.getLastEntry();
    const isWebSocketHeader = true;
    const { error } = await TimeEntry.endInProgress(Object.assign(lastEntry, {isWebSocketHeader}));
    this.clearNotification('breakOver');
    this.sendPomodoroEvent(null);
    if (error && error.status === 400) {
        aBrowser.storage.local.get(["timeEntryInProgress"], async (result) => {
            const {entry: ent, error: err} = 
                await TimeEntry.saveEntryOfflineAndStopItByDeletingIt(result.timeEntryInProgress, new Date(), isWebSocketHeader);
            // if (!err) 
            continueLastEntryTimer(lastEntry, isWebSocketHeader);
        });
    } 
    else {
        continueLastEntryTimer(lastEntry, isWebSocketHeader);
    }
}

async function continueLastEntryTimer(timeEntry, isWebSocketHeader) {
    const isPomodoro = true;
    const { entry,  error } = await TimeEntry.startTimer(
        timeEntry.description, 
        {
            projectId: timeEntry.projectId,
            task: timeEntry.taskId ? { id: timeEntry.taskId } : null,
            billable: timeEntry.billable,
            tags: timeEntry.tagIds ? timeEntry.tagIds.map(tagId => ({id: tagId})) : null,
            isWebSocketHeader
        }, 
        isPomodoro
    );

    if (entry && entry.id) {
        const pomodoroForUser = getPomodoroForUser();
        aBrowser.storage.local.set({
            timeEntryInProgress: entry
        });
        this.sendPomodoroEvent(entry);
        const start = new Date(entry.timeInterval.start);

        pomodoroInterval = setInterval(() => {
            const currDate = new Date();
            const diff = currDate.getTime() - start.getTime();
            if (diff >= pomodoroForUser.timerInterval * 60 * 1000) {
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
            }
        }, 1000);
    }
}

function restartPomodoro() {
    this.removeAllPomodoroTimers();
    breakCounter = 0;
}

function sendPomodoroEvent(timeEntry) {
    aBrowser.runtime.sendMessage({
        eventName: 'pomodoroEvent',
        timeEntry: timeEntry
    });
}

