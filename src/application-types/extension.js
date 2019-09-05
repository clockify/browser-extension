import React from 'react';
import ReactDOM from 'react-dom';
import {getBrowser} from "../helpers/browser-helper";
import {getIconStatus} from "../enums/browser-icon-status-enum";
import Login from "../components/login.component";
import HomePage from "../components/home-page.component";
import {getEntryInProgress, startTimer, stopInProgress} from "../helpers/integration-helper";
import {checkConnection} from "../components/check-connection";
import {LocalStorageService} from "../services/localStorage-service";
import {UserService} from "../services/user-service";
import {isAppTypeExtension} from "../helpers/app-types-helper";

const localStorageService = new LocalStorageService();
const userService = new UserService();

export class Extension {

    setIcon(iconStatus) {
        const iconPathStarted = '../assets/images/logo-16.png';
        const iconPathEnded = '../assets/images/logo-16-gray.png';

        getBrowser().browserAction.setIcon({
            path: getIconStatus().timeEntryStarted === iconStatus ? iconPathStarted : iconPathEnded
        });
    }

    afterLoad() {
        getBrowser().storage.sync.get(
            ['token', 'activeWorkspaceId', 'userId', 'userEmail',
                'weekStart', 'timeZone', 'refreshToken', 'userSettings'], (result) => {
                const mountHtmlElem = document.getElementById('mount');
                if (mountHtmlElem) {
                    mountHtmlElem.style.width = '360px';
                    mountHtmlElem.style.minHeight = '430px';
                }

                if (result.userId) {
                    if (!JSON.parse(localStorageService.get('offline'))) {
                        userService.getUser(result.userId)
                            .then(response => {
                                let data = response.data;
                                localStorage.setItem('userEmail', data.email);
                                localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                                localStorage.setItem('userSettings', JSON.stringify(data.settings));
                                if (mountHtmlElem) {
                                    ReactDOM.render(<HomePage/>, mountHtmlElem);
                                }
                            }).catch(error => {
                            if (mountHtmlElem) {
                                ReactDOM.render(
                                    <Login logout={true}/>,
                                    mountHtmlElem
                                );
                            }
                        });
                    } else {
                        if (mountHtmlElem) {
                            ReactDOM.render(<HomePage/>, mountHtmlElem);
                        }
                    }
                } else {
                    this.setIcon(getIconStatus().timeEntryEnded);
                    if (mountHtmlElem) {
                        ReactDOM.render(
                            <Login/>,
                            mountHtmlElem
                        );
                    }
                }
            });
        getBrowser().tabs.query({}, (tabs) => {
            const baseUrl = localStorageService.get('baseUrl');
            let clientUrl = this.setHomeUrlFromBaseUrl(baseUrl);
            const clockifyTabs = tabs.filter(tab => tab.url && tab.url.includes(clientUrl));

            if (!clockifyTabs.length) {
                return;
            }

            getBrowser().tabs.sendMessage(clockifyTabs[0].id, {method: "getLocalStorage"}, (response) => {
                const mountHtmlElem = document.getElementById('mount');
                if (mountHtmlElem) {
                    mountHtmlElem.style.width = '360px';
                    mountHtmlElem.style.minHeight = '430px';
                }
                if (response && response.token !== 'null' && response.userId) {
                    const storageItems = {
                        token: response.token,
                        refreshToken: response.refreshToken,
                        activeWorkspaceId: JSON.parse(response.activeWorkspace).id,
                        userId: JSON.parse(response.user).id,
                        weekStart: JSON.parse(response.user).settings.weekStart,
                        timeZone: JSON.parse(response.user).settings.timeZone,
                        userSettings: JSON.stringify(JSON.parse(response.user).settings),
                        userEmail: response.userEmail
                    };

                    this.saveAllToStorages(storageItems);
                    if (mountHtmlElem) {
                        ReactDOM.render(
                            <HomePage/>,
                            document.getElementById('mount')
                        );
                    }
                }
            });
        });

        this.registerButtonHandlers();
    }

    setHomeUrlFromBaseUrl(baseUrl) {
        let clientUrl = "";
        if (baseUrl.includes('api.clockify.me')) {
            clientUrl = "clockify.me"
        } else {
            clientUrl = baseUrl.replace(/https?:\/\//, '').replace('/api', '');
        }
        return clientUrl;
    }

    loadFromStorage(key) {
        return localStorageService.get(key);
    }

    registerButtonHandlers() {
        getBrowser().runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.eventName) {
                case 'endInProgress':
                    this.stopEntryInProgress(sendResponse);
                    break;
                case 'startWithDescription':
                    this.startNewEntry(request, sendResponse);
                    break;
            }
            return true;
        });
    }

    stopEntryInProgress(sendResponse) {
        stopInProgress().then((response) => {
            if (response.status !== 400) {
                if (isAppTypeExtension) {
                    getBrowser().notifications.clear('idleDetection');
                    getBrowser().extension.getBackgroundPage().restartPomodoro();
                }
                this.setIcon(getIconStatus().timeEntryEnded);
            }
            sendResponse({status: response.status});
        });
    }

    startNewEntry(request, sendResponse) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return this.stopTimerAndStartNewEntry(request, sendResponse);
            } else {
                return this.startTimer(request, sendResponse);
            }
        });
    }

    stopTimerAndStartNewEntry(request, sendResponse) {
        stopInProgress().then((response) => {
            if (response.status === 200) {
                if (isAppTypeExtension) {
                    getBrowser().notifications.clear('idleDetection');
                    getBrowser().extension.getBackgroundPage().restartPomodoro();
                }
                this.startTimer(request, sendResponse);
            } else {
                sendResponse({status: response.status})
            }
        })
    }

    startTimer(request, sendResponse) {
        startTimer(request.description || "", request.project)
            .then((response) => {
                if (!response.message) {
                    window.inProgress = true;
                    this.setIcon(getIconStatus().timeEntryStarted);
                    getBrowser().extension.getBackgroundPage().addPomodoroTimer();
                    sendResponse({status: 200, data: response})
                }
            })
    }

    getEntryInProgressForBrowserIcon() {
        if (!checkConnection()) {
            return getEntryInProgress().then((response) => {
                if (response && response.id) {
                    window.inProgress = true;
                    this.setIcon(getIconStatus().timeEntryStarted);
                } else {
                    window.inProgress = false;
                    this.setIcon(getIconStatus().timeEntryEnded);
                }
            });
        } else {
            window.inProgress = false;
            this.setIcon(getIconStatus().timeEntryEnded);
        }

    }

    saveOneToLocalStorage(key, value) {
        localStorage.setItem(key, value);
    }

    saveOneToBrowserStorage(map) {
        getBrowser().storage.sync.set(map);
    }

    saveOneToStorages(key, value) {
        this.saveOneToLocalStorage(key, value);
        this.saveOneToBrowserStorage({key: value});
    }

    saveAllToLocalStorage(map) {
        for (const key in map) {
            this.saveOneToLocalStorage(key, map[key]);
        }
    }

    saveAllToBrowserStorage(map) {
        getBrowser().storage.sync.set(map);
    }

    saveAllToStorages(map) {
        this.saveAllToLocalStorage(map);
        this.saveAllToBrowserStorage(map);
    }

}
