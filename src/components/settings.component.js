import * as React from 'react';
import {getBrowser, isChrome} from "../helpers/browser-helper";
import {isAppTypeDesktop, isAppTypeExtension, isAppTypeMobile} from "../helpers/app-types-helper";
import Header from "./header.component";
import {UserService} from "../services/user-service";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import TimePicker from 'antd/lib/time-picker';
import moment from "moment";
import {HtmlStyleHelper} from "../helpers/html-style-helper";
import {getKeyCodes} from "../enums/key-codes.enum";
import Pomodoro from "./pomodoro.component";
import DarkModeComponent from "./dark-mode.component";
import DefaultProject from "./default-project.component";
import Toaster from "./toaster-component";
import * as ReactDOM from "react-dom";
import HomePage from "./home-page.component";

const userService = new UserService();
const localStorageService = new LocalStorageService();
const htmlStyleHelpers = new HtmlStyleHelper();

const daysOfWeek = [
    {id:1, name:"Mo"},
    {id:2, name:"Tu"},
    {id:3, name:"We"},
    {id:4, name:"Th"},
    {id:5, name:"Fr"},
    {id:6, name:"Sa"},
    {id:0, name:"Su"}
];

class Settings extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            userEmail: '',
            userPicture: null,
            sendErrors: JSON.parse(localStorageService.get('sendErrors')),
            isSelfHosted: JSON.parse(localStorageService.get('selfHosted', false)),
            idleDetection: false,
            idleDetectionCounter: null,
            timerShortcut: true,
            reminder: false,
            reminderFromTime: null,
            reminderToTime: null,
            reminderMinutesSinceLastEntry: 0,
            autoStartOnBrowserStart: false,
            autoStopOnBrowserClose: false,
            changeSaved: false
        };
    }

    componentDidMount(){
        this.getUserSettings();

        if (isAppTypeExtension()) {
            this.isIdleDetectionOn();
            this.isReminderOn();
            this.isAutoStartStopOn();
            this.isTimerShortcutOn();
        }
    }

    isIdleDetectionOn() {
        const idleDetectionFromStorage = localStorageService.get('idleDetection');
        const userId = localStorageService.get('userId');

        this.setState({
            idleDetectionCounter: idleDetectionFromStorage && JSON.parse(idleDetectionFromStorage)
                    .filter(idleDetectionByUser =>
                        idleDetectionByUser.userId === userId && idleDetectionByUser.counter > 0).length > 0 ?
                JSON.parse(idleDetectionFromStorage).filter(idleDetectionByUser =>
                    idleDetectionByUser.userId === userId && idleDetectionByUser.counter > 0)[0].counter : 0,
            idleDetection: !!(idleDetectionFromStorage && JSON.parse(idleDetectionFromStorage)
                        .filter(idleDetectionByUser =>
                            idleDetectionByUser.userId === userId && idleDetectionByUser.counter > 0).length > 0)
        }, () => {
            if (this.state.idleDetection) {
                setTimeout(
                    () => {
                        const idleElem = document.getElementById('idleDetection');
                        if (this.state.idleDetection) {
                            idleElem.style.maxHeight = idleElem.scrollHeight + 40 + 'px';
                        } else {
                            idleElem.style.maxHeight = '0';
                        }
                    },
                    150
                );
            }
        });
    }

    isTimerShortcutOn() {
        const timerShortcutFromStorage = localStorageService.get('timerShortcut');
        const userId = localStorageService.get('userId');

        this.setState({
            timerShortcut: timerShortcutFromStorage && JSON.parse(timerShortcutFromStorage)
                .filter(timerShortcutByUser =>
                    timerShortcutByUser.userId === userId && JSON.parse(timerShortcutByUser.enabled)).length > 0
        });
    }

    isReminderOn() {
        const reminderFromStorage = localStorageService.get('reminders');
        const userId = localStorageService.get('userId');
        const reminderFromStorageForUser = reminderFromStorage ?
            JSON.parse(reminderFromStorage).filter(reminder => reminder.userId === userId)[0] : null;

        if (!reminderFromStorageForUser) {
            return
        }

        this.setState({
            reminder: reminderFromStorageForUser.enabled
        }, () => {
            if (reminderFromStorageForUser.enabled) {
                setTimeout(
                    () => {
                        const reminderElem = document.getElementById('reminder');
                        if (reminderFromStorageForUser.enabled) {
                            reminderElem.style.maxHeight = reminderElem.scrollHeight + 'px';
                        } else {
                            reminderElem.style.maxHeight = '0';
                        }
                    },
                    200
                );
            }
        });

        setTimeout(() => this.checkForRemindersDatesAndTimes(), 200);
    }

    isAutoStartStopOn() {
        const userId = localStorageService.get('userId');
        const autoStartFromStorage = localStorageService.get('autoStartOnBrowserStart') ?
            JSON.parse(localStorageService.get('autoStartOnBrowserStart')) : [];
        const autoStopFromStorage = localStorageService.get('autoStopOnBrowserClose') ?
            JSON.parse(localStorageService.get('autoStopOnBrowserClose')) : [];

        this.setState({
            autoStartOnBrowserStart:
                autoStartFromStorage.filter(autoStart => autoStart.userId === userId && autoStart.enabled).length > 0,
            autoStopOnBrowserClose:
                autoStopFromStorage.filter(autoStop => autoStop.userId === userId && autoStop.enabled).length > 0
        });
    }

    checkForRemindersDatesAndTimes() {
        const userId = localStorageService.get('userId');
        const reminderDatesAndTimesFromStorageForUser =
            JSON.parse(localStorageService.get('reminderDatesAndTimes'))
                .filter(reminderDatesAndTimes => reminderDatesAndTimes.userId === userId)[0];

        this.setState({
            reminderFromTime: reminderDatesAndTimesFromStorageForUser.timeFrom,
            reminderToTime: reminderDatesAndTimesFromStorageForUser.timeTo,
            reminderMinutesSinceLastEntry: parseInt(reminderDatesAndTimesFromStorageForUser.minutesSinceLastEntry)
        });

        reminderDatesAndTimesFromStorageForUser.dates.forEach(date => {
            const activeDayName = daysOfWeek.filter(day => day.id === date).map(day => day.name)[0];
            document.getElementById(activeDayName).classList.add('day-active');
        });
    }

    getUserSettings() {
        const userId = localStorage.getItem('userId');
        userService.getUser(userId)
            .then(response => {
                let data = response.data;
                this.setState({
                    userEmail: data.email,
                    userPicture: data.profilePicture
                })
            })
    }

    toggleSendErrors() {
        if (this.state.sendErrors) {
            localStorageService.set('sendErrors', false, getLocalStorageEnums().PERMANENT_PREFIX);
            window.metricService.init();
            this.setState({
                sendErrors: false
            });
        } else {
            localStorageService.set('sendErrors', true, getLocalStorageEnums().PERMANENT_PREFIX);
            window.metricService.disable();
            this.setState({
                sendErrors: true
            });
        }
        this.showSuccessMessage();
    }

    toggleIdleDetection() {
        const idleDetectionFromStorage = localStorageService.get('idleDetection');
        const userId = localStorageService.get('userId');
        let idleDetectionToSaveInStorage;
        let idleCounter;

        const idleElem = document.getElementById('idleDetection');

        if (this.state.idleDetection) {
            idleDetectionToSaveInStorage = JSON.parse(idleDetectionFromStorage)
                .filter(idleDetection => idleDetection.userId !== userId);

            this.setState({
                idleDetection: false
            }, () => idleElem.style.maxHeight = '0');
            idleCounter = 0;
            this.sendIdleDetectionRequest(idleCounter);
        } else {
            idleCounter = 15;
            const idleDetectionForCurrentUser = {userId: userId, counter: idleCounter};
            idleDetectionToSaveInStorage = idleDetectionFromStorage ? [
                ...JSON.parse(idleDetectionFromStorage),
                idleDetectionForCurrentUser
            ] :
            [idleDetectionForCurrentUser];

            this.setState({
                idleDetection: true,
                idleDetectionCounter: idleCounter
            }, () => idleElem.style.maxHeight = idleElem.scrollHeight + 40 + 'px');

            this.sendIdleDetectionRequest(idleCounter);
        }

        localStorageService.set(
            'idleDetection',
            JSON.stringify(idleDetectionToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        this.showSuccessMessage();
    }

    changeIdleCounter(event) {
        let value = parseInt(event.target.value);
        if (value === 0) {
            value = 1;
        }

        const userId = localStorageService.get('userId');
        const idleDetectionFromStorage = localStorageService.get('idleDetection');

        let idleDetectionToSaveInStorage = JSON.parse(idleDetectionFromStorage)
            .filter(idleDetection => idleDetection.userId !== userId);

        const idleDetectionForCurrentUserFromStorage = JSON.parse(idleDetectionFromStorage)
            .filter(idleDetection => idleDetection.userId === userId)[0];

        const idleDetectionForCurrentUserChanged = {
            userId: userId,
            counter: value ? value : idleDetectionForCurrentUserFromStorage.counter
        };

        this.setState({
            idleDetectionCounter: value ? value : idleDetectionForCurrentUserFromStorage.counter
        });


        this.sendIdleDetectionRequest(idleDetectionForCurrentUserChanged.counter);

        idleDetectionToSaveInStorage = [...idleDetectionToSaveInStorage, idleDetectionForCurrentUserChanged];

        localStorageService.set(
            'idleDetection',
            JSON.stringify(idleDetectionToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        this.showSuccessMessage();
    }

    changeIdleDetectionCounterState(event) {
        this.setState({
            idleDetectionCounter: event.target.value
        });
    }

    sendIdleDetectionRequest(counter) {
        if (isAppTypeExtension()) {
            getBrowser().runtime.sendMessage({
                eventName: "idleDetection",
                counter: counter
            });
        }
    }

    sendReminderRequest() {
        if (isAppTypeExtension()) {
            getBrowser().runtime.sendMessage({
                eventName: "reminder"
            });
        }
    }

    toggleTimerShortcut() {
        const timerShortcutFromStorage = localStorageService.get('timerShortcut');
        const userId = localStorageService.get('userId');
        let timerShortcutToSaveInStorage;

        if (this.state.timerShortcut) {
            timerShortcutToSaveInStorage = JSON.parse(timerShortcutFromStorage)
                .map(timerShortcut => {
                    if (timerShortcut.userId === userId) {
                        timerShortcut.enabled = false;
                        return timerShortcut;
                    }
                });

            this.setState({
                timerShortcut: false
            });
        } else {
            timerShortcutToSaveInStorage = JSON.parse(timerShortcutFromStorage)
                .map(timerShortcut => {
                    if (timerShortcut.userId === userId) {
                        timerShortcut.enabled = true;
                        return timerShortcut;
                    }
                });

            this.setState({
                timerShortcut: true
            });
        }

        if (timerShortcutToSaveInStorage) {
            localStorageService.set(
                'timerShortcut',
                JSON.stringify(timerShortcutToSaveInStorage),
                getLocalStorageEnums().PERMANENT_PREFIX
            );
            this.showSuccessMessage();
        }
    }

    toggleReminder() {
        const reminderFromStorage = localStorageService.get('reminders') ?
            JSON.parse(localStorageService.get('reminders')) : [];
        const userId = localStorageService.get('userId');
        const reminderForCurrentUser =
            reminderFromStorage &&
            reminderFromStorage.filter(reminder => reminder.userId === userId).length > 0 ?
                reminderFromStorage.filter(reminder => reminder.userId === userId)[0] : null;
        const reminderDatesAndTimesFromStorage = localStorageService.get('reminderDatesAndTimes') ?
            JSON.parse(localStorageService.get('reminderDatesAndTimes')) : [];
        let reminderToSaveInStorage;
        let reminderDatesAndTimesToSaveInStorage;

        const reminderElem = document.getElementById('reminder');

        if (!reminderForCurrentUser) {
            reminderToSaveInStorage = [...reminderFromStorage, {userId: userId, enabled: true}];
            reminderDatesAndTimesToSaveInStorage = [
                ...reminderDatesAndTimesFromStorage,
                {userId: userId, dates: [1,2,3,4,5], timeFrom: "09:00", timeTo: "17:00", minutesSinceLastEntry: 10}
            ];

            localStorageService.set(
                'reminderDatesAndTimes',
                JSON.stringify(reminderDatesAndTimesToSaveInStorage),
                getLocalStorageEnums().PERMANENT_PREFIX
            );

            this.setState({
                reminder: true,
                reminderFromTime: "09:00",
                reminderToTime: "17:00",
                reminderMinutesSinceLastEntry: 10
            }, () => {
                this.checkForRemindersDatesAndTimes();
                this.sendReminderRequest();
                reminderElem.style.maxHeight = reminderElem.scrollHeight + 'px';
            });
        } else {
            if (this.state.reminder) {
                reminderToSaveInStorage = reminderFromStorage.map(reminder => {
                        if (reminder.userId === userId) {
                            reminder.enabled = false;

                            this.setState({
                                reminder: false
                            }, () => {
                                reminderElem.style.maxHeight = '0';
                                if (isAppTypeExtension()) {
                                    getBrowser().extension.getBackgroundPage().removeReminderTimer();
                                }
                            });
                        }
                        return reminder;
                    });
            } else {
                reminderToSaveInStorage = reminderFromStorage.map(reminder => {
                        if (reminder.userId === userId) {
                            reminder.enabled = true;

                            this.setState({
                                reminder: true
                            }, () => {
                                this.checkForRemindersDatesAndTimes();
                                this.sendReminderRequest();
                                reminderElem.style.maxHeight = reminderElem.scrollHeight + 'px';
                            });
                        }
                        return reminder;
                    });
            }
        }

        localStorageService.set(
            'reminders',
            JSON.stringify(reminderToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        this.showSuccessMessage();
    }

    changeReminderMinutes(event) {
        let value = parseInt(event.target.value);

        if (value === 0) {
            value = 1;
        }

        const userId = localStorageService.get('userId');
        const remindersDatesAndTimesToSaveInStorage =
            JSON.parse(localStorageService.get('reminderDatesAndTimes'))
                .map(reminder => {
                    if (reminder.userId === userId) {
                        reminder.minutesSinceLastEntry = value ? value : reminder.minutesSinceLastEntry;

                        this.setState({
                            reminderMinutesSinceLastEntry: value ? value : reminder.minutesSinceLastEntry
                        });
                    }

                    return reminder;
                });

        localStorageService.set(
            'reminderDatesAndTimes',
            JSON.stringify(remindersDatesAndTimesToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        if (isAppTypeExtension()) {
            getBrowser().extension.getBackgroundPage().removeReminderTimer();
            getBrowser().extension.getBackgroundPage().addReminderTimer();
        }

        this.showSuccessMessage();
    }

    changeReminderMinutesState(event) {
        this.setState({
            reminderMinutesSinceLastEntry: event.target.value
        });
    }

    toggleDay(event) {
        const day = daysOfWeek.filter(day => day.name === event.target.firstChild.textContent)[0];
        const userId = localStorageService.get('userId');
        const reminderDatesAndTimesFromStorage =
            JSON.parse(localStorageService.get('reminderDatesAndTimes')).map(reminder => {
                if (reminder.userId === userId) {
                    if (reminder.dates.includes(day.id)) {
                        reminder.dates.splice(reminder.dates.indexOf(day.id), 1);
                        setTimeout(() => {
                            document.getElementById(day.name).classList.remove('day-active');
                        }, 100);
                    } else {
                        reminder.dates.push(day.id);
                        document.getElementById(day.name).classList.add('day-active');
                    }
                }

                return reminder;
            });

        localStorageService.set(
            'reminderDatesAndTimes',
            JSON.stringify(reminderDatesAndTimesFromStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        if (isAppTypeExtension()) {
            getBrowser().extension.getBackgroundPage().removeReminderTimer();
            getBrowser().extension.getBackgroundPage().addReminderTimer();
        }
        this.showSuccessMessage();
    }

    selectReminderFromTime(time, timeString) {
        if (timeString) {
            this.setState({
                reminderFromTime: timeString
            });
        }
    }

    selectReminderToTime(time, timeString) {
        if (timeString) {
            this.setState({
                reminderToTime: timeString
            });
        }
    }

    openReminderFromTimePicker(event) {
        this.fadeBackgroundAroundTimePicker(event);
        if (!event) {
            if (this.state.reminderFromTime) {
                this.changeTime(this.state.reminderFromTime, 'fromTime');
            }
        }
    }

    openReminderToTimePicker(event) {
        this.fadeBackgroundAroundTimePicker(event);
        if (!event) {
            if (this.state.reminderToTime) {
                this.changeTime(this.state.reminderToTime, 'toTime');
            }
        }
    }

    changeTime(time, type) {
        const userId = localStorageService.get('userId');
        const remindersForCurrentUserToSaveInStorage =
            JSON.parse(localStorageService.get('reminderDatesAndTimes')).map(reminder => {
                if (reminder.userId === userId) {
                    if (type === 'fromTime') {
                        reminder.timeFrom = time;
                    } else {
                        reminder.timeTo = time;
                    }
                }

                return reminder
            });

        localStorageService.set(
            'reminderDatesAndTimes',
            JSON.stringify(remindersForCurrentUserToSaveInStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        if (isAppTypeExtension()) {
            getBrowser().extension.getBackgroundPage().removeReminderTimer();
            getBrowser().extension.getBackgroundPage().addReminderTimer();
        }

        this.showSuccessMessage();
    }

    fadeBackgroundAroundTimePicker(event) {
        if (event) {
            htmlStyleHelpers.fadeBackground();
        } else {
            setTimeout(() => {
                htmlStyleHelpers.unfadeBackground();
            }, 100);
        }
    }

    changeReminderMinutesOnEnter(event) {
        if (event.keyCode === getKeyCodes().enter) {
            this.changeReminderMinutes(event);
        }
    }

    changeIdleCounterOnEnter(event) {
        if (event.keyCode === getKeyCodes().enter) {
            this.changeIdleCounter(event);
        }
    }

    toggleAutoStartOnBrowserStart() {
        const userId = localStorageService.get('userId');
        let autoStartFromStorage = localStorageService.get('autoStartOnBrowserStart') ?
            JSON.parse(localStorageService.get('autoStartOnBrowserStart')) : [];
        const autoStartForCurrentUser =
            autoStartFromStorage &&
            autoStartFromStorage.filter(autoStart => autoStart.userId === userId).length > 0 ?
                autoStartFromStorage.filter(autoStart => autoStart.userId === userId)[0] : null;

        if (!autoStartForCurrentUser) {
            autoStartFromStorage = [...autoStartFromStorage, {userId: userId, enabled: true}];

            this.setState({
                autoStartOnBrowserStart: true
            });
        } else {
            if (this.state.autoStartOnBrowserStart) {
                autoStartFromStorage = autoStartFromStorage.map(autoStart => {
                    if (autoStart.userId === userId) {
                        autoStart.enabled = false;
                    }

                    return autoStart;
                });
                this.setState({
                    autoStartOnBrowserStart: false
                });
            } else {
                autoStartFromStorage = autoStartFromStorage.map(autoStart => {
                    if (autoStart.userId === userId) {
                        autoStart.enabled = true;
                    }

                    return autoStart;
                });

                this.setState({
                    autoStartOnBrowserStart: true
                });
            }
        }

        localStorageService.set(
            'autoStartOnBrowserStart',
            JSON.stringify(autoStartFromStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        this.showSuccessMessage();
    }

    toggleAutoStopOnBrowserClose() {
        const userId = localStorageService.get('userId');
        let autoStopFromStorage = localStorageService.get('autoStopOnBrowserClose') ?
            JSON.parse(localStorageService.get('autoStopOnBrowserClose')) : [];
        const autoStopForCurrentUser =
            autoStopFromStorage &&
            autoStopFromStorage.filter(autoStop => autoStop.userId === userId).length > 0 ?
                autoStopFromStorage.filter(autoStop => autoStop.userId === userId)[0] : null;

        if (!autoStopForCurrentUser) {
            autoStopFromStorage = [...autoStopFromStorage, {userId: userId, enabled: true}];

            this.setState({
                autoStopOnBrowserClose: true
            });
        } else {
            if (this.state.autoStopOnBrowserClose) {
                autoStopFromStorage = autoStopFromStorage.map(autoStop => {
                    if (autoStop.userId === userId) {
                        autoStop.enabled = false;
                    }

                    return autoStop;
                });
                this.setState({
                    autoStopOnBrowserClose: false
                });
            } else {
                autoStopFromStorage = autoStopFromStorage.map(autoStop => {
                    if (autoStop.userId === userId) {
                        autoStop.enabled = true;
                    }

                    return autoStop;
                });

                this.setState({
                    autoStopOnBrowserClose: true
                });
            }
        }

        localStorageService.set(
            'autoStopOnBrowserClose',
            JSON.stringify(autoStopFromStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        this.showSuccessMessage();
    }

    showSuccessMessage() {
        this.toaster.toast('success', 'Change saved.', 2);
    }

    goBackToHomePage() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<HomePage/>, document.getElementById('mount'));
    }

    render(){
        let version;
        if (isAppTypeDesktop()) {
            version =
                <div className="app-version">Version: {localStorage.getItem('appVersion')}</div>
        }

        if(!this.state.userPicture) {
            return null;
        } else {
            return(
                <div className="settings_page">
                    <Toaster
                        ref={instance => {
                            this.toaster = instance
                        }}
                    />
                    <div className="settings_page__header">
                        <Header
                            showActions={false}
                            backButton={true}
                            goBackTo={this.goBackToHomePage.bind(this)}
                        />
                    </div>
                    <div className="user-settings">
                        <span><img src={this.state.userPicture}/></span>
                        <span>{this.state.userEmail}</span>
                    </div>
                    <DefaultProject
                        workspaceSettings={this.props.workspaceSettings}
                        changeSaved={this.showSuccessMessage.bind(this)}
                    />
                    <DarkModeComponent
                        changeSaved={this.showSuccessMessage.bind(this)}
                    />
                    <div className={isAppTypeExtension() && !this.state.isSelfHosted ?
                        "settings__send-errors" : "disabled"}
                         onClick={this.toggleTimerShortcut.bind(this)}>
                        <span className={this.state.timerShortcut ?
                            "settings__send-errors__checkbox checked" : "settings__send-errors__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.timerShortcut ?
                                     "settings__send-errors__checkbox--img" :
                                     "settings__send-errors__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">Start/stop timer shortcut</span>
                        <span className="settings__send-errors__title--shortcut">(Ctrl+Shift+U)</span>
                    </div>
                    <div className={!this.state.isSelfHosted ? "settings__send-errors" : "disabled"}
                         onClick={this.toggleSendErrors.bind(this)}>
                        <span className={this.state.sendErrors ?
                            "settings__send-errors__checkbox checked" : "settings__send-errors__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.sendErrors ?
                                     "settings__send-errors__checkbox--img" :
                                     "settings__send-errors__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">Send errors</span>
                    </div>
                    <div className={isAppTypeExtension() && isChrome() ?
                            "settings__auto_start_on_browser_start" : "disabled"}
                         onClick={this.toggleAutoStartOnBrowserStart.bind(this)}>
                        <span className={this.state.autoStartOnBrowserStart ?
                            "settings__auto_start_on_browser_start__checkbox checked" :
                            "settings__auto_start_on_browser_start__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.autoStartOnBrowserStart ?
                                     "settings__auto_start_on_browser_start__checkbox--img" :
                                     "settings__auto_start_on_browser_start__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__auto_start_on_browser_start__title">
                            Start timer when browser starts
                        </span>
                    </div>
                    <div className={isAppTypeExtension() && isChrome() ?
                            "settings__auto_stop_on_browser_close" : "disabled"}
                         onClick={this.toggleAutoStopOnBrowserClose.bind(this)}>
                        <span className={this.state.autoStopOnBrowserClose ?
                            "settings__auto_stop_on_browser_close__checkbox checked" :
                            "settings__auto_stop_on_browser_close__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.autoStopOnBrowserClose ?
                                     "settings__auto_stop_on_browser_close__checkbox--img" :
                                     "settings__auto_stop_on_browser_close__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__auto_stop_on_browser_close__title">
                            Stop timer when browser closes
                        </span>
                    </div>
                    <div className={isAppTypeExtension() ? "settings__reminder__section expandTrigger" : "disabled"}
                         onClick={this.toggleReminder.bind(this)}>
                        <span className={this.state.reminder ?
                            "settings__reminder__section__checkbox checked" : "settings__reminder__section__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.reminder ?
                                     "settings__reminder__section__checkbox--img" :
                                     "settings__reminder__section__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">Remind me to track time</span>
                    </div>
                    <div id="reminder"
                         className="settings__reminder expandContainer">
                        <div className="settings__reminder__week">
                            {
                                daysOfWeek.map(day => {
                                    return (
                                        <div id={day.name}
                                             className="settings__reminder__week__day"
                                             onClick={this.toggleDay.bind(this)}>
                                            <span className="settings__reminder__week__day--name">
                                                {day.name}
                                            </span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="settings__reminder__times">
                            <div className="settings__reminder__times--from">
                                <p>From</p>
                                <TimePicker id="reminderFromTime"
                                            className="settings__reminder__time_picker"
                                            value={moment(this.state.reminderFromTime, 'HH:mm')}
                                            format="HH:mm"
                                            size="large"
                                            onChange={this.selectReminderFromTime.bind(this)}
                                            onOpenChange={this.openReminderFromTimePicker.bind(this)}
                                />
                            </div>
                            <div className="settings__reminder__times--to">
                                <p>To</p>
                                <TimePicker id="reminderFromTime"
                                            className="settings__reminder__time_picker"
                                            value={moment(this.state.reminderToTime, "HH:mm")}
                                            format="HH:mm"
                                            size="large"
                                            onChange={this.selectReminderToTime.bind(this)}
                                            onOpenChange={this.openReminderToTimePicker.bind(this)}
                                />
                            </div>
                        </div>
                        <div className="settings__reminder__times--minutes_since_last_entry">
                            <input value={this.state.reminderMinutesSinceLastEntry}
                                   onBlur={this.changeReminderMinutes.bind(this)}
                                   onKeyDown={this.changeReminderMinutesOnEnter.bind(this)}
                                   onChange={this.changeReminderMinutesState.bind(this)}/>
                            <p>minutes since last entry</p>
                        </div>
                    </div>
                    <div className={isAppTypeExtension() ? "settings__idle-detection expandTrigger" : "disabled"}
                         onClick={this.toggleIdleDetection.bind(this)}>
                        <span className={this.state.idleDetection ?
                            "settings__idle-detection__checkbox checked" : "settings__idle-detection__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.idleDetection ?
                                     "settings__idle-detection__checkbox--img" :
                                     "settings__idle-detection__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">Idle detection</span>
                    </div>
                    <div id="idleDetection"
                         className="settings__idle-detection__box expandContainer">
                        <div className="settings__idle-detection__box__content">
                            <p>Detect idle time if inactive for</p>
                            <input id="idleDetectionCounter"
                                   value={this.state.idleDetectionCounter}
                                   onBlur={this.changeIdleCounter.bind(this)}
                                   onKeyDown={this.changeIdleCounterOnEnter.bind(this)}
                                   onChange={this.changeIdleDetectionCounterState.bind(this)}/>
                            <p>minutes</p>
                        </div>
                    </div>
                    <Pomodoro
                        changeSaved={this.showSuccessMessage.bind(this)}
                    />
                    { version}
                </div>
            )
        }
    }
}

export default Settings;