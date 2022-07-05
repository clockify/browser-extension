import React from 'react';
import ReactDOM from 'react-dom';
import {getBrowser} from "../helpers/browser-helper";
import {getIconStatus} from "../enums/browser-icon-status-enum";
import Login from "../components/login.component";
import HomePage from "../components/home-page.component";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {UserService} from "../services/user-service";
import locales from "../helpers/locales";
import {HtmlStyleHelper} from "../helpers/html-style-helper";

const localStorageService = new LocalStorageService();
const userService = new UserService();
const htmlStyleHelper = new HtmlStyleHelper();

export class Extension {

    setIcon(iconStatus) {
        const iconPathStarted = '../assets/images/logo-16.png';
        const iconPathEnded = '../assets/images/logo-16-gray.png';

        getBrowser().action.setIcon({
            path: getIconStatus().timeEntryStarted === iconStatus ? iconPathStarted : iconPathEnded
        });
    }

    
    async afterLoad() {
        const token = await localStorageService.get("token");
        const isOffline = await localStorageService.get("offline");
        const mountHtmlElem = document.getElementById('mount');
        // if (mountHtmlElem) {
        //     mountHtmlElem.style.width = '360px';
        //     mountHtmlElem.style.minHeight = '430px';
        // }
        
        if (token) {
            await htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();
            if (!JSON.parse(isOffline)) {                
                ReactDOM.render(<HomePage/>, mountHtmlElem);
                userService.getUser()
                    .then(async (response) => {
                        let data = response.data;
                        localStorage.setItem('userEmail', data.email);
                        localStorage.setItem('userId', data.id);
                        localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                        localStorage.setItem('userSettings', JSON.stringify(data.settings));
                        const lang = data.settings.lang ? data.settings.lang.toLowerCase() : null;
                        locales.onProfileLangChange(lang);
                        getBrowser().runtime.sendMessage({
                            eventName: "pomodoroTimer"
                        });
                        userService.getBoot()
                            .then(response => {
                                const { data } = response;
                                const { selfHosted } = data;
                                if (data.synchronization && data.synchronization.websockets) {
                                    const { websockets } = data.synchronization;
                                    let endPoint;
                                    if (websockets.apps && websockets.apps.extension) {
                                        endPoint = websockets.apps.extension.endpoint;
                                    }
                                    else {
                                        endPoint = websockets.endpoint;
                                    }
                                    if (endPoint.startsWith("/")) {
                                        endPoint = `${data.frontendUrl.replace(/\/$/, "")}${endPoint}`;
                                    }
                                    localStorageService.set(
                                        "webSocketEndpoint",
                                        endPoint,
                                        getLocalStorageEnums().PERMANENT_PREFIX);
                                }
                                // if (mountHtmlElem) {
                                    // ReactDOM.render(<HomePage/>, mountHtmlElem);
                                // }
                            })
                            .catch( err => {
                                console.log(err);
                                // if (mountHtmlElem) {
                                    // ReactDOM.render(<HomePage/>, mountHtmlElem);
                                // }
                            })
                    })
                    .catch(async (error) => {
                        if (mountHtmlElem) {
                            const isOffline = await localStorage.getItem('offline');
                            if (isOffline === 'true') {
                                // ReactDOM.render(<HomePage/>, mountHtmlElem);
                            }
                            else {
                                ReactDOM.render(<Login logout={true}/>, mountHtmlElem);
                            }
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

        // if (!isOffline())
        //     this.registerButtonHandlers();
    }


    // async setHomeUrlFromBaseUrl(baseUrl) {
    //     const subDomainName = await localStorageService.get("subDomainName", null);
    //     let clientUrl = "";
    //     if (baseUrl.includes('api.clockify.me')) {
    //         clientUrl = "clockify.me";
    //     } else {
    //         clientUrl = baseUrl.replace(/https?:\/\//, '').replace('/api', '');
    //     }

    //     if (subDomainName !== null)
    //         clientUrl = `${subDomainName}.${clientUrl}`;

    //     return "/" + clientUrl;
    // }

    // async loadFromStorage(key) {
    //     return await localStorageService.get(key);
    // }

    // registerButtonHandlers() {
    //     getBrowser().runtime.onMessage.addListener((request, sender, sendResponse) => {
    //         switch (request.eventName) {
    //             case 'submitTime':
    //                 this.submitTime(request, sendResponse);
    //                 break;
    //         }                    
    //         return true;
    //     });
    // }

   
    // submitTime(request, sendResponse) {
    //     const end = new Date();
    //     request.timeEntryOptions.start = new Date(end.getTime() - request.totalMins * 60000);
    //     request.timeEntryOptions.end = end;

    //     startTimer(request.timeEntryOptions)
    //         .then(sendResponse);
    // }

    // getEntryInProgressForBrowserIcon() {
    //     if (!isOffline()) {
    //         return getEntryInProgress().then((response) => {
    //             if (response && response.id) {
    //                 window.inProgress = true;
    //                 this.setIcon(getIconStatus().timeEntryStarted);
    //             } else {
    //                 window.inProgress = false;
    //                 this.setIcon(getIconStatus().timeEntryEnded);
    //             }
    //         });
    //     } else {
    //         window.inProgress = false;
    //         this.setIcon(getIconStatus().timeEntryEnded);
    //     }

    // }

    saveOneToLocalStorage(key, value) {
        localStorage.setItem(key, value);
    }

    saveOneToBrowserStorage(map) {
        getBrowser().storage.local.set(map);
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
        getBrowser().storage.local.set(map);
    }

    saveAllToStorages(map) {
        this.saveAllToLocalStorage(map);
        this.saveAllToBrowserStorage(map);
    }

}
