import * as React from 'react';
import {getBrowser, isChrome} from "../helpers/browser-helper";
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
import locales from "../helpers/locales";

import dateFnsLocale from './date-fns-locale';

const userService = new UserService();
const localStorageService = new LocalStorageService();
const htmlStyleHelpers = new HtmlStyleHelper();

class Settings extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            userEmail: '',
            userPicture: '',
            createObjects: null,
            isSelfHosted: null,
            idleDetection: false,
            idleDetectionCounter: '',
            timerShortcut: true,
            reminder: false,
            reminderFromTime: '',
            reminderToTime: '',
            reminderMinutesSinceLastEntry: 0,
            contextMenuEnabled: true,
            autoStartOnBrowserStart: false,
            autoStopOnBrowserClose: false,
            showPostStartPopup: true,
            changeSaved: false,
            daysOfWeekLocales: [],
            daysOfWeek: [
                {id:1, name: 'MON', active: true},
                {id:2, name: 'TUE', active: true},
                {id:3, name: 'WED', active: true},
                {id:4, name: 'THU', active: true},
                {id:5, name: 'FRI', active: true},
                {id:6, name: 'SAT', active: false},
                {id:7, name: 'SUN', active: false}
            ]
        };

        this.pomodoroEnd = React.createRef();
        this.setAsyncStateItems = this.setAsyncStateItems.bind(this);
        this.toggleDay = this.toggleDay.bind(this);
        this.checkForRemindersDatesAndTimes = this.checkForRemindersDatesAndTimes.bind(this);
    }

    async setAsyncStateItems() {
        const createObjects = JSON.parse(await localStorageService.get('createObjects', false));
        const isSelfHosted = JSON.parse(await localStorageService.get('selfHosted', false));
        const daysOfWeekLocales = await dateFnsLocale.getDaysShort();
        const userEmail = await localStorage.getItem('userEmail');
        const userPicture = await localStorage.getItem('profilePicture');
        this.setState({
            createObjects,
            isSelfHosted,
            daysOfWeekLocales,
            userEmail,
            userPicture
        });
    }

    componentDidMount(){
        this.getUserSettings();
        this.isIdleDetectionOn();
        this.isReminderOn();
        this.isAutoStartStopOn();
        this.isTimerShortcutOn();
        this.isContextMenuOn();
        this.isShowPostStartPopup();
        
        this.scrollIntoView = this.scrollIntoView.bind(this);
        this.setAsyncStateItems();
    }

    scrollIntoView() {
        setTimeout(() => {
            this.pomodoroEnd.current.scrollIntoView({ behavior: 'smooth' })
        }, 200);
    }

    async isIdleDetectionOn() {
        const idleDetectionFromStorage = await localStorageService.get('idleDetection');
        const userId = await localStorageService.get('userId');

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

    async isShowPostStartPopup() {
        const showPostStartPopup = JSON.parse(await localStorageService.get('showPostStartPopup', 'true'));
        this.setState({showPostStartPopup});
        getBrowser().storage.local.set({
            showPostStartPopup: (showPostStartPopup)
        });
    }

    async isTimerShortcutOn() {
        const timerShortcutFromStorage = await localStorageService.get('timerShortcut');
        const userId = await localStorageService.get('userId');

        this.setState({
            timerShortcut: timerShortcutFromStorage && JSON.parse(timerShortcutFromStorage)
                .filter(timerShortcutByUser =>
                    timerShortcutByUser && timerShortcutByUser.userId === userId && timerShortcutByUser.enabled).length > 0
        });
    }

    async isContextMenuOn() {
        const contextMenuEnabled = JSON.parse(await localStorageService.get('contextMenuEnabled', 'true'));
        this.setState({ contextMenuEnabled });
    }

    async isReminderOn() {
        const reminderFromStorage = await localStorageService.get('reminders');
        const userId = await localStorageService.get('userId');
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

    async isAutoStartStopOn() {
        const userId = await localStorageService.get('userId');
        const autoStartOnBrowserStart = await localStorageService.get('autoStartOnBrowserStart');
        const autoStartFromStorage = autoStartOnBrowserStart ?
            JSON.parse(autoStartOnBrowserStart) : [];
        const autoStopOnBrowserClose = await localStorageService.get('autoStopOnBrowserClose');
        const autoStopFromStorage = autoStopOnBrowserClose ?
            JSON.parse(autoStopOnBrowserClose) : [];

        this.setState({
            autoStartOnBrowserStart:
                autoStartFromStorage.filter(autoStart => autoStart.userId === userId && autoStart.enabled).length > 0,
            autoStopOnBrowserClose:
                autoStopFromStorage.filter(autoStop => autoStop.userId === userId && autoStop.enabled).length > 0
        });
    }

    

    async checkForRemindersDatesAndTimes() {
        const userId = await localStorageService.get('userId');
        const reminderDatesAndTimesFromStorageForUser =
            JSON.parse(await localStorageService.get('reminderDatesAndTimes'))
                .filter(reminderDatesAndTimes => reminderDatesAndTimes.userId === userId)[0];

        this.setState(state => ({
            reminderFromTime: reminderDatesAndTimesFromStorageForUser.timeFrom,
            reminderToTime: reminderDatesAndTimesFromStorageForUser.timeTo,
            reminderMinutesSinceLastEntry: parseInt(reminderDatesAndTimesFromStorageForUser.minutesSinceLastEntry),
            daysOfWeek: state.daysOfWeek.map(day => ({...day, active: reminderDatesAndTimesFromStorageForUser.dates.includes(day.id)}))
        }));

        // reminderDatesAndTimesFromStorageForUser.dates.forEach(date => {
        //     // const activeDayName = this.state.daysOfWeek.filter(day => day.id === date).map(day => day.name)[0];
        //     document.getElementById('day_' + date).classList.add('day-active');
        // });
    }

    getUserSettings() {
        userService.getUser()
            .then(response => {
                let data = response.data;
                this.setState({
                    userEmail: data.email,
                    userPicture: data.profilePicture
                }, () => {
                    localStorage.setItem('userEmail', this.state.userEmail);
                    localStorage.setItem('profilePicture', this.state.userPicture);
                })
            })
    }

    toggleShowPostStartPopup() {
        const showPostStartPopup = !this.state.showPostStartPopup;
        this.setState({showPostStartPopup});
        localStorageService.set('showPostStartPopup', showPostStartPopup.toString(), getLocalStorageEnums().PERMANENT_PREFIX);
        getBrowser().storage.local.set({
            showPostStartPopup: (showPostStartPopup)
        });
        this.showSuccessMessage();
    }

    toggleCreateObjects() {
        if (this.state.createObjects) {
            localStorageService.set('createObjects', false, getLocalStorageEnums().PERMANENT_PREFIX);
            this.setState({
                createObjects: false
            });
        } else {
            localStorageService.set('createObjects', true, getLocalStorageEnums().PERMANENT_PREFIX);
            this.setState({
                createObjects: true
            });
        }
        this.showSuccessMessage();
    }

    async toggleIdleDetection() {
        const idleDetectionFromStorage = await localStorageService.get('idleDetection');
        const userId = await localStorageService.get('userId');
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

    async changeIdleCounter(event) {
        let value = parseInt(event.target.value);
        if (value === 0) {
            value = 1;
        }

        const userId = await localStorageService.get('userId');
        const idleDetectionFromStorage = await localStorageService.get('idleDetection');

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
        getBrowser().runtime.sendMessage({
            eventName: "idleDetection",
            counter: counter
        });
    }

    sendReminderRequest() {
        getBrowser().runtime.sendMessage({
            eventName: "reminder"
        });
    }

    async toggleTimerShortcut() {
        const timerShortcutFromStorage = await localStorageService.get('timerShortcut');
        const userId = await localStorageService.get('userId');
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

    async toggleReminder() {
        const reminders = await localStorageService.get('reminders');
        const reminderFromStorage =reminders ?
            JSON.parse(reminders) : [];
        const userId = await localStorageService.get('userId');
        const reminderForCurrentUser =
            reminderFromStorage &&
            reminderFromStorage.filter(reminder => reminder.userId === userId).length > 0 ?
                reminderFromStorage.filter(reminder => reminder.userId === userId)[0] : null;
        const reminderDatesAndTimes = await localStorageService.get('reminderDatesAndTimes');
        const reminderDatesAndTimesFromStorage = reminderDatesAndTimes ?
            JSON.parse(reminderDatesAndTimes) : [];
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
                                // getBrowser().extension.getBackgroundPage().removeReminderTimer();
                                getBrowser().runtime.sendMessage({
                                    eventName: 'removeReminderTimer'
                                });
                                
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

    async changeReminderMinutes(event) {
        let value = parseInt(event.target.value);

        if (value === 0) {
            value = 1;
        }

        const userId = await localStorageService.get('userId');
        const remindersDatesAndTimesToSaveInStorage =
            JSON.parse(await localStorageService.get('reminderDatesAndTimes'))
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

        // getBrowser().extension.getBackgroundPage().removeReminderTimer();
        // getBrowser().extension.getBackgroundPage().addReminderTimer();
        getBrowser().runtime.sendMessage({
            eventName: 'removeReminderTimer'
        });
        getBrowser().runtime.sendMessage({
            eventName: 'reminder'
        });

        this.showSuccessMessage();
    }

    changeReminderMinutesState(event) {
        this.setState({
            reminderMinutesSinceLastEntry: event.target.value
        });
    }

    toggleContextMenu() {
        const contextMenuEnabled = !this.state.contextMenuEnabled;
        this.setState({ contextMenuEnabled });
        localStorageService.set(
            'contextMenuEnabled',
            JSON.stringify(contextMenuEnabled),
            getLocalStorageEnums().PERMANENT_PREFIX
        );
        this.sendToggleContextMenuRequest(contextMenuEnabled);
        this.showSuccessMessage();
    }

    sendToggleContextMenuRequest(iscontextMenuEnabled) {
        getBrowser().runtime.sendMessage({
            eventName: "contextMenuEnabledToggle",
            enabled: iscontextMenuEnabled
        });
        
    }    

    async toggleDay(dayName) {
        const day = this.state.daysOfWeek.find(day => day.name === dayName);
        const userId = await localStorageService.get('userId');
        const reminderDatesAndTimesFromStorage =
            JSON.parse(await localStorageService.get('reminderDatesAndTimes')).map(reminder => {
                if (reminder.userId === userId) {
                    if (reminder.dates.includes(day.id)) {
                        reminder.dates.splice(reminder.dates.indexOf(day.id), 1);
                        this.setState(state => ({daysOfWeek: state.daysOfWeek.map(day => ({...day, active: day.name === dayName ? false : day.active}))}));
                    } else {
                        reminder.dates.push(day.id);
                        this.setState(state => ({daysOfWeek: state.daysOfWeek.map(day => ({...day, active: day.name === dayName ? true : day.active}))}));
                    }
                }

                return reminder;
            });

        localStorageService.set(
            'reminderDatesAndTimes',
            JSON.stringify(reminderDatesAndTimesFromStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        // getBrowser().extension.getBackgroundPage().removeReminderTimer();
        // getBrowser().extension.getBackgroundPage().addReminderTimer();
        getBrowser().runtime.sendMessage({
            eventName: 'removeReminderTimer'
        });
        getBrowser().runtime.sendMessage({
            eventName: 'reminder'
        });

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

    async changeTime(time, type) {
        const userId = await localStorageService.get('userId');
        const remindersForCurrentUserToSaveInStorage =
            JSON.parse(await localStorageService.get('reminderDatesAndTimes')).map(reminder => {
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

        // getBrowser().extension.getBackgroundPage().removeReminderTimer();
        // getBrowser().extension.getBackgroundPage().addReminderTimer();
        getBrowser().runtime.sendMessage({
            eventName: 'removeReminderTimer'
        });
        getBrowser().runtime.sendMessage({
            eventName: 'reminder'
        });

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
        const { enter, minus } = getKeyCodes();
        if (minus.includes(event.keyCode)) {
            if (event.preventDefault) 
                event.preventDefault();
            return false;
        }
        else if (enter.includes(event.keyCode)) {
            this.changeReminderMinutes(event);
        }
    }

    changeIdleCounterOnEnter(event) {
        const { enter, minus } = getKeyCodes();
        if (minus.includes(event.keyCode)) {
            if (event.preventDefault) 
                event.preventDefault();
            return false;
        }
        else if (enter.includes(event.keyCode)) {
            this.changeIdleCounter(event);
        }
    }

    async toggleAutoStartOnBrowserStart() {
        const userId = await localStorageService.get('userId');
        const autoStartOnBrowserStart = await localStorageService.get('autoStartOnBrowserStart')
        let autoStartFromStorage = autoStartOnBrowserStart ?
            JSON.parse(autoStartOnBrowserStart) : [];
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

    async toggleAutoStopOnBrowserClose() {
        const userId = await localStorageService.get('userId');
        const autoStopOnBrowserClose = await localStorageService.get('autoStopOnBrowserClose');
        let autoStopFromStorage = autoStopOnBrowserClose ?
            JSON.parse(autoStopOnBrowserClose) : [];
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
        this.toaster.toast('success', `${locales.CHANGE_SAVED}.`, 2);
    }

    async goBackToHomePage() {
        ReactDOM.unmountComponentAtNode(document.getElementById('mount'));
        ReactDOM.render(<HomePage />, document.getElementById('mount'));
    }

    render(){
        let version;

        // if(!this.state.userPicture) {
        //     return null;
        // } else {
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
                        <span>{this.state.userPicture && <img src={this.state.userPicture}/>}</span>
                        <span>{this.state.userEmail}</span>
                    </div>
                    <DefaultProject
                        workspaceSettings={this.props.workspaceSettings}
                        changeSaved={this.showSuccessMessage.bind(this)}
                    />
                    <div className="settings__send-errors"
                         onClick={this.toggleCreateObjects.bind(this)}>
                        <span className={this.state.createObjects ?
                            "settings__send-errors__checkbox checked" : "settings__send-errors__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.createObjects ?
                                     "settings__send-errors__checkbox--img" :
                                     "settings__send-errors__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">{locales.INTEGRATIONS_CAN_CREATE_PROJECTS}</span>
                    </div>
                    <DarkModeComponent
                        changeSaved={this.showSuccessMessage.bind(this)}
                    />

                    <div className="settings__send-errors"
                         onClick={this.toggleShowPostStartPopup.bind(this)}>
                        <span className={this.state.showPostStartPopup ?
                            "settings__send-errors__checkbox checked" : "settings__send-errors__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.showPostStartPopup ?
                                     "settings__send-errors__checkbox--img" :
                                     "settings__send-errors__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">{locales.SHOW_POST_START_POPUP}</span>
                    </div>


                    <div className={!this.state.isSelfHosted ?
                        "settings__send-errors" : "disabled"}
                         onClick={this.toggleTimerShortcut.bind(this)}>
                        <span className={this.state.timerShortcut ?
                            "settings__send-errors__checkbox checked" : "settings__send-errors__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.timerShortcut ?
                                     "settings__send-errors__checkbox--img" :
                                     "settings__send-errors__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">{locales.START}/{locales.STOP} {locales.TIMER} {locales.SHORTCUT}</span>
                        <span className="settings__send-errors__title--shortcut">(Ctrl+Shift+U)</span>
                    </div>
                    <div className={isChrome() ?
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
                            {locales.START_TIMER_WHEN_BROWSER_STARTS}
                        </span>
                    </div>
                    <div className={isChrome() ?
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
                            {locales.STOP_TIMER_WHEN_BROWSER_CLOSES}
                        </span>
                    </div>
                    <div className="settings__reminder__section expandTrigger"
                         onClick={this.toggleReminder.bind(this)}>
                        <span className={this.state.reminder ?
                            "settings__reminder__section__checkbox checked" : "settings__reminder__section__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.reminder ?
                                     "settings__reminder__section__checkbox--img" :
                                     "settings__reminder__section__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">{locales.REMIND_ME_TO_TRACK_TIME}</span>
                    </div>
                    <div id="reminder"
                         className="settings__reminder expandContainer">
                        <div className="settings__reminder__week">
                            {
                                this.state.daysOfWeek.map(day => {
                                    return (
                                        <div id={'day_' + day.id} 
                                             key={day.name}
                                             className={'settings__reminder__week__day' + (day.active ? ' day-active' : '')}
                                             onClick={() => this.toggleDay(day.name)}>
                                            <span className="settings__reminder__week__day--name">
                                                {(this.state.daysOfWeekLocales[day.id === 7 ? 0 : day.id] || day.name)}
                                            </span>
                                        </div>
                                    )
                                })
                            }
                        </div>
                        <div className="settings__reminder__times">
                            <div className="settings__reminder__times--from">
                                <p>{locales.FROM}</p>
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
                                <p>{locales.TO}</p>
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
                            <p>{locales.MINUTES_SINCE_LAST_ENTRY}</p>
                        </div>
                    </div>
                    <div className="settings__context_menu__section"
                        onClick={this.toggleContextMenu.bind(this)}>
                        <span className={this.state.contextMenuEnabled ?
                            "settings__context_menu__section__checkbox checked" : "settings__context_menu__section__checkbox"}>
                            <img src="./assets/images/checked.png"
                                className={this.state.contextMenuEnabled ?
                                    "settings__context_menu__section__checkbox--img" :
                                    "settings__context_menu__section__checkbox--img_hidden"} />
                        </span>
                        <span className="settings__send-errors__title">{locales.ENABLE_CONTEXT_MENU}</span>
                    </div>                         
                    <div className="settings__idle-detection expandTrigger"
                         onClick={this.toggleIdleDetection.bind(this)}>
                        <span className={this.state.idleDetection ?
                            "settings__idle-detection__checkbox checked" : "settings__idle-detection__checkbox"}>
                            <img src="./assets/images/checked.png"
                                 className={this.state.idleDetection ?
                                     "settings__idle-detection__checkbox--img" :
                                     "settings__idle-detection__checkbox--img_hidden"}/>
                        </span>
                        <span className="settings__send-errors__title">{locales.IDLE_DETECTION}</span>
                    </div>
                    <div id="idleDetection"
                         className="settings__idle-detection__box expandContainer">
                        <div className="settings__idle-detection__box__content">
                            <p>{locales.DETECT_IDLE_TIME}</p>
                            <input id="idleDetectionCounter"
                                   value={this.state.idleDetectionCounter}
                                   onBlur={this.changeIdleCounter.bind(this)}
                                   onKeyDown={this.changeIdleCounterOnEnter.bind(this)}
                                   onChange={this.changeIdleDetectionCounterState.bind(this)}/>
                            <p>minutes</p>
                        </div>
                    </div>
                    <Pomodoro
                        workspaceSettings={this.props.workspaceSettings}
                        changeSaved={this.showSuccessMessage.bind(this)}
                        scrollIntoView = {this.scrollIntoView}
                    />
                    <div ref={this.pomodoroEnd} />
                    { version}
                </div>
            )
        // }
    }
}

export default Settings;