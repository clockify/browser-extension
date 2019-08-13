let idleDetectedIn;
const minuteInMilliseconds =  60000;
const idleButtons = ['Discard idle time', 'Discard and continue'];
const idleChangeStateListener = (callback) => {
    const idleDetectionByUser = this.getIdleDetectionByUser();
    if (document.timeEntry) {
        if (idleDetectionByUser && callback === 'idle') {
            idleDetectedIn = (new Date() - parseInt(idleDetectionByUser.counter) * minuteInMilliseconds);
            this.setTimeEntryToDetectedIdleTime(document.timeEntry.id);
        } else if (
            idleDetectedIn &&
            parseInt(idleDetectedIn) > 0 &&
            callback === 'active' &&
            idleDetectionByUser.timeEntryId === document.timeEntry.id
        ) {
            this.createIdleNotification(document.timeEntry.description, idleDetectedIn);
        }
    }
};

this.setIdleDetectionOnBrowserStart();

aBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.eventName === 'idleDetection') {
        if (parseInt(request.counter) > 0) {
            aBrowser.idle.setDetectionInterval(parseInt(request.counter) * 60);

            if (document.timeEntry) {
                aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);
            } else {
                if (idleChangeStateListener && aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)) {
                    aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener)
                }
            }
        } else {
            if (idleChangeStateListener && aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)) {
                aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
            }
        }
    }
});


function addIdleListenerIfIdleIsEnabled() {
    const idleDetectionByUser = this.getIdleDetectionByUser();

    if (idleDetectionByUser && idleDetectionByUser.counter > 0) {
        aBrowser.idle.setDetectionInterval(parseInt(idleDetectionByUser.counter) * 60);
        aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);
    }
}

function removeIdleListenerIfIdleIsEnabled() {
    const idleDetectionByUser = this.getIdleDetectionByUser();

    if (idleDetectionByUser && idleDetectionByUser.counter > 0 && idleChangeStateListener) {
        aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
    }

    this.clearNotification('idleDetection');
}

function setIdleDetectionOnBrowserStart() {
    const idleDetectionByUser = this.getIdleDetectionByUser();

    if (idleDetectionByUser && idleDetectionByUser.counter > 0) {
        aBrowser.idle.setDetectionInterval(parseInt(idleDetectionByUser.counter) * 60);

        if (document.timeEntry) {
            aBrowser.idle.onStateChanged.addListener(idleChangeStateListener);
        } else {
            if (idleChangeStateListener && aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)) {
                aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
            }
        }
    } else {
        if (idleChangeStateListener && aBrowser.idle.onStateChanged.hasListener(idleChangeStateListener)) {
            aBrowser.idle.onStateChanged.removeListener(idleChangeStateListener);
        }
    }
}

function getIdleDetectionByUser() {
    const idleDetectionFromStorage = localStorage.getItem('permanent_idleDetection');
    const userId = localStorage.getItem('userId');

    return idleDetectionFromStorage ?
        JSON.parse(idleDetectionFromStorage).filter(idleDetectionByUser => idleDetectionByUser.userId === userId)[0] :
        null;
}

function createIdleNotification(description, idleDetectedIn) {
    const idleDuration = this.getIdleDuration(idleDetectedIn);
    const buttonsForMessage = [
        {title: idleButtons[0]},
        {title: idleButtons[1]}
    ];

    const notificationOptions = {
        type: "basic",
        iconUrl: "./assets/icons/64x64.png",
        title: "Idle time detected",
        message: this.createIdleMessage(description, idleDuration)
    };

    if (this.isChrome()) {
        notificationOptions.buttons = buttonsForMessage;
        notificationOptions.requireInteraction = true;
    } else {
        notificationOptions.message = notificationOptions.message + '. Click here to discard idle and stop entry.'
    }
    this.createNotification('idleDetection', notificationOptions);
}

function getIdleDuration(idleDetectedIn) {
    const currentTime = new Date();
    let idleDuration;
    let idleDurationHours = 0;
    let idleDurationMinutes = parseInt(((currentTime - idleDetectedIn) / minuteInMilliseconds)
                                .toString().split('.')[0]);

    if (idleDurationMinutes >= 60) {
        if (idleDurationMinutes % 60 > 0) {
            idleDurationMinutes = idleDurationMinutes % 60;
            idleDurationHours = (idleDurationMinutes - idleDurationMinutes % 60) / 60;
        } else {
            idleDurationHours = idleDurationMinutes / 60;
            idleDurationMinutes = 0;
        }
    }

    idleDuration = {
        hours: idleDurationHours,
        minutes: idleDurationMinutes
    };

    return idleDuration;
}

function createIdleMessage(description, idleDuration) {
    let message = "You've been inactive for ";
    if (idleDuration.hours > 0) {
        message += idleDuration.minutes + "h ";
    }
    message += idleDuration.minutes + "m while tracking ";

    if (!!description) {
        message += "'" + description + "'";
    } else {
        message += "(no description)";
    }

    return message;
}

function discardIdleTimeAndStopEntry() {
    this.getEntryInProgress().then(response => response.json()).then(data => {
        this.endInProgress(new Date(idleDetectedIn)).then((response) => {
            this.clearNotification('idleDetection');

            if (response.status == 400) {
                this.saveEntryOfflineAndStopItByDeletingIt(data, idleDetectedIn);
            }
            this.entryInProgressChangedEventHandler(null);
        });
    });
}

function discardIdleTimeAndContinueEntry() {
    this.getEntryInProgress().then(response => response.json()).then(data => {
        this.endInProgress(new Date(idleDetectedIn)).then((response) => {
            this.clearNotification('idleDetection');

            if (response.status == 400) {
                this.saveEntryOfflineAndStopItByDeletingIt(data, idleDetectedIn);
            }

            this.startTimer(
                data.description,
                {
                    projectId: data.projectId,
                    billable: data.billable,
                    taskId: data.taskId,
                    tagIds: data.tagIds
                }
            )
        });
    });
}

function setTimeEntryToDetectedIdleTime(timeEntryId) {
    const userId = localStorage.getItem('userId');
    const idleDetectionToSaveInStorage =
        JSON.parse(localStorage.getItem('permanent_idleDetection')).map(idleDetection => {
            if (idleDetection.userId === userId) {
                idleDetection.timeEntryId = timeEntryId;
            }

            return idleDetection;
        });

    localStorage.setItem('permanent_idleDetection', JSON.stringify(idleDetectionToSaveInStorage));
}
