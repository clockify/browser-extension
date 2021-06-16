import React from 'react';
import ReactDOM from 'react-dom';
import {getBrowser} from "../helpers/browser-helper";
import {getIconStatus} from "../enums/browser-icon-status-enum";
import Login from "../components/login.component";
import HomePage from "../components/home-page.component";
import { getEntryInProgress, startTimer, stopInProgress,
         getProjectTaskFromDB, 
         getProjects, getProjectTasks,
         getProjectsByIdsForIntegration,
         getTags
} from "../helpers/integration-helper";
import {isOffline} from "../components/check-connection";
import {LocalStorageService} from "../services/localStorage-service";
import {UserService} from "../services/user-service";
import {isAppTypeExtension} from "../helpers/app-types-helper";
import {TimeEntryService} from "../services/timeEntry-service";

const localStorageService = new LocalStorageService();
const userService = new UserService();
const timeEntryService = new TimeEntryService();


export class Extension {

    setIcon(iconStatus) {
        const iconPathStarted = '../assets/images/logo-16.png';
        const iconPathEnded = '../assets/images/logo-16-gray.png';

        getBrowser().browserAction.setIcon({
            path: getIconStatus().timeEntryStarted === iconStatus ? iconPathStarted : iconPathEnded
        });
    }

    
    afterLoad() {
        const token = localStorageService.get("token");
        const mountHtmlElem = document.getElementById('mount');
        if (mountHtmlElem) {
            mountHtmlElem.style.width = '360px';
            mountHtmlElem.style.minHeight = '430px';
        }
        if (token) {
            if (!JSON.parse(localStorageService.get('offline'))) {
                userService.getUser()
                    .then(response => {
                        let data = response.data;
                        localStorage.setItem('userEmail', data.email);
                        localStorage.setItem('userId', data.id);
                        localStorage.setItem('activeWorkspaceId', data.activeWorkspace);
                        localStorage.setItem('userSettings', JSON.stringify(data.settings));
                        if (mountHtmlElem) {
                            ReactDOM.render(<HomePage/>, mountHtmlElem);
                        }
                    }).catch(error => {
                        if (mountHtmlElem) {
                            if (localStorage.getItem('offline') === 'true') {
                                ReactDOM.render(<HomePage/>, mountHtmlElem);
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

        if (!isOffline())
            this.registerButtonHandlers();
    }


    setHomeUrlFromBaseUrl(baseUrl) {
        const subDomainName = localStorageService.get("subDomainName", null);
        let clientUrl = "";
        if (baseUrl.includes('api.clockify.me')) {
            clientUrl = "clockify.me";
        } else {
            clientUrl = baseUrl.replace(/https?:\/\//, '').replace('/api', '');
        }

        if (subDomainName !== null)
            clientUrl = `${subDomainName}.${clientUrl}`;

        return "/" + clientUrl;
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
                case 'submitTime':
                    this.submitTime(request, sendResponse);
                    break;
                // popupDlg
                case 'getDefaultProjectTask':
                    this.getDefaultProjectTask(request, sendResponse);
                    break;
                case 'getProjects':
                    this.getProjects(request, sendResponse);
                    break;
                case 'getProjectTasks':
                    this.getProjectTasks(request, sendResponse);
                    break;
                case 'getProjectsByIds':
                    this.getProjectsByIds(request, sendResponse);
                    break;
                case 'submitDescription':
                    this.submitDescription(request, sendResponse);
                    break;
                case 'editProject':
                    this.editProject(request, sendResponse);
                    break;
                case 'editTask':
                    this.editTask(request, sendResponse);
                    break;
                case 'getTags':
                    this.getTags(request, sendResponse);
                    break;
                case 'editTags':
                    this.editTags(request, sendResponse);
                    break;
                case 'fetchEntryInProgress':
                    this.fetchEntryInProgress(request, sendResponse);
                    break;                    
                case 'editBillable':
                    this.editBillable(request, sendResponse);
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
        })
        .catch((error) => {
            sendResponse(error)
        });
    }

    startNewEntry(request, sendResponse) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return this.stopTimerAndStartNewEntry(request, sendResponse);
            } else {
                return this.startTimer(request, sendResponse);
            }
        })
        .catch((error) => {
            sendResponse(error)
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
        startTimer(request.timeEntryOptions)
            .then((response) => {
                if (response.status === 201) {
                    window.inProgress = true;
                    this.setIcon(getIconStatus().timeEntryStarted);
                    getBrowser().extension.getBackgroundPage().addPomodoroTimer();
                }
                sendResponse(response);
            })
            .catch((error) => {
                sendResponse(error)
            })
    }

    submitTime(request, sendResponse) {
        const end = new Date();
        request.timeEntryOptions.start = new Date(end.getTime() - request.totalMins * 60000);
        request.timeEntryOptions.end = end;

        startTimer(request.timeEntryOptions)
            .then(sendResponse);
    }

    getEntryInProgressForBrowserIcon() {
        if (!isOffline()) {
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


    async getDefaultProjectTask(request, sendResponse) {
        getEntryInProgress()
            .then(async response => {
                if (response && response.id) {
                    const {projectDB, taskDB, msg, msgId} = await getProjectTaskFromDB(request.options);
                    sendResponse({projectDB, taskDB, msg, msgId});
                }
            })
            .catch((error) => {
                console.log('>>>>> error', error)
                sendResponse({projectDB: null , taskDB: null, msg:error})
            });
    }

    getProjects(request, sendResponse) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return getProjects(request.options)
                    .then((response) => {
                        if (response.status === 201) {
                        }
                        sendResponse(response);
                    })
                    .catch((error) => {
                        sendResponse(error)
                    })
            }
        })
        .catch((error) => {
            sendResponse(error)
        });
    }
    
    getProjectTasks(request, sendResponse) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return getProjectTasks(request.options)
                    .then((response) => {
                        if (response.status === 201) {
                        }
                        sendResponse(response);
                    })
                    .catch((error) => {
                        sendResponse(error)
                    })
            }
        })
        .catch((error) => {
            sendResponse(error)
        });
    }


    getProjectsByIds(request, sendResponse) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return getProjectsByIdsForIntegration(request.options)
                    .then((response) => {
                        if (response.status === 200) {
                        }
                        sendResponse(response);
                    })
                    .catch((error) => {
                        console.log('salje error:', error)
                        sendResponse(error)
                    })
            }
        })
        .catch((error) => {
            sendResponse(error)
        });
    }

    getTags(request, sendResponse) {
        getEntryInProgress().then((response) => {
            if (response && response.id) {
                return getTags(request.options)
                    .then((response) => {
                        if (response.status === 201) {
                        }
                        sendResponse(response);
                    })
                    .catch((error) => {
                        console.log('salje error:', error)
                        sendResponse(error)
                    })
            }
        })
        .catch((error) => {
            sendResponse(error)
        });
    }
 
 
    // popupDlg
    submitDescription(request, sendResponse) {
        const { id, description } = request.timeEntryOptions;
        return timeEntryService.setDescription(id, description.trim())
            .then(response => {
                sendResponse(response);
            })
            .catch(() => {
            });
    }

    editProject(request, sendResponse) {
        const { id, project} = request.timeEntryOptions;
        if (!project.id) {
            return timeEntryService.removeProject(id)
                .then((response) => {
                    sendResponse(response);
                })
                .catch((error) => {
                });
        } else {
            return timeEntryService.updateProject(project.id, id)
                .then(response => {
                    sendResponse(response);
                })
                .catch((error) => {
                    console.log(error)
                    // this.notifyError(error);
                });
        }
    }

    editTask(request, sendResponse) {
        const { id, project, task } = request.timeEntryOptions;
        if (!task) {
            return timeEntryService.removeTask(id)
                .then(response => {
                    sendResponse(response.data);
                })
                .catch(() => {
                });
        } else {
            return timeEntryService.updateTask(task.id, project.id, id)
                .then(response => {
                    sendResponse(response.data);
                })
                .catch((error) => {
                    console.log(error)
                });
        }
    }

    editTags(request, sendResponse) {
        const { id, tagIds } = request.timeEntryOptions;
        return timeEntryService.updateTags(tagIds, id)
            .then(response => {
                let data = response.data;
                sendResponse({
                    status: 200,
                    timeEntry: data
                });
            })
            .catch(() => {
            })
    }

    fetchEntryInProgress(request, sendResponse) { // to get tag names
        timeEntryService.getEntryInProgress().then((response) => {
            sendResponse(response)
        })
        .catch((error) => {
            sendResponse(error)
        });
    }    

    editBillable(request, sendResponse) {
        const { id, billable} = request.timeEntryOptions;
        return timeEntryService.updateBillable(billable, id)
            .then(response => {
                let data = response.data;
                sendResponse({
                    status: 200,
                    timeEntry: data
                });
            })
            .catch(() => {
            })
    }

}
