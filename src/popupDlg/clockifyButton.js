var aBrowser = chrome || browser;
var _clockifyPopupDlg;
var _waitingForResponse = false;
removeAllButtons();
var clockifyButton = {
    links: [],
    observer: null,
    titleObserver: null,
    inProgressDescription: "",
    nextIndex: 0,
    render: (selector, opts, renderer, mutationSelector) => {
        if (opts.observe) { 
            if (!clockifyButton.observer) {
                if (opts.noDebounce) {
                    clockifyButton.observer = new MutationObserver(clockifyButton.callback);
                  } else {
                    clockifyButton.observer = new MutationObserver(clockifyDebounce(clockifyButton.callback, 1000));
                  }               
                clockifyButton.observer.observe(
                    document,
                    {childList: true, subtree: true}
                );
            }
            clockifyButton.allSelectors.push({selector, renderer, mutationSelector})
        }
        clockifyButton.renderTo(selector, renderer); 
    },
    renderTo: (selector, renderer) => {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
            for (let i = 0; i < elements.length; i++) {
                elements[i].classList.add('clockify');
                elements[i].classList.add('clockifyId' + i);
                renderer(elements[i]);
            }
        }
    },

    allSelectors: [],
    callback: (mutations) => {
        for(const item of clockifyButton.allSelectors) {
            const {selector, renderer, mutationSelector} = item;
            if (mutationSelector) {
                const matches = mutations.filter(function (mutation) {
                    return mutation.target.matches(mutationSelector);
                });
                if (!matches.length) {
                    continue;
                }
            }
            clockifyButton.renderTo(selector, renderer);
        }
    },

    disconnectObserver: () => {
        clockifyButton.observer?.disconnect()
        clockifyButton.titleObserver?.disconnect()
    },

    createButton: (description, project, task) => {
       
        // const allContainers = document.querySelectorAll('.clockifyButton');
        // if (allContainers.length < clockifyButton.nextIndex) {
        //     clockifyButton.nextIndex = allContainers.length;            
        // } else {
        //     clockifyButton.nextIndex = 0;
        // }

        const currIndex = clockifyButton.nextIndex++;
        
        window.updateButtonProperties({newRoot: true, buttonId: currIndex}, {isPopupOpen: false});
        
        const options = objectFromParams(description, project, task);
        clockifyButton.options = options;
        const button = document.createElement('div');
        if (invokeIfFunction(options.small)) {
            button.classList.add('small');
        }

        const title = invokeIfFunction(options.description);
        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
            const entry = result.timeEntryInProgress;
            if (entry && entry.id) {
                if (!!entry.description) {
                    clockifyButton.inProgressDescription = entry.description;
                } else {
                    clockifyButton.inProgressDescription = "";
                }
            } else {
                clockifyButton.inProgressDescription = null;
            }

            let active = title && title === clockifyButton.inProgressDescription;
            setButtonProperties(button, title, active, currIndex);

            this.setClockifyButtonLinks(button);
            window.updateButtonProperties({
                options, 
                title, 
                active, 
                small: !!options.small,
                buttonId: currIndex
            }, {
                inProgressDescription: clockifyButton.inProgressDescription, 
            });
        });
    
        // button.addEventListener('click', (e) => {
        //     e.stopPropagation();
        //     this.buttonClicked(button, options)
        // });

        return button;
    },

    createSmallButton: (description, project) => {
        const options = objectFromParams(description, project);
        options.small = true;

        return clockifyButton.createButton(options);
    },

    createInput: (options) => {
        const form = document.createElement('form');
        form.setAttribute("id", "clockify-manual-input-form");
        const input = document.createElement('input');
        form.appendChild(input);
        input.classList.add("clockify-input");
        input.classList.add("clockify-input-default");
        input.setAttribute("placeholder", clockifyLocales.ADD_TIME_MANUAL);

        aBrowser.storage.local.get(["workspaceSettings"], (result) => {
            result = JSON.parse(result.workspaceSettings);
            if(result.timeTrackingMode === "STOPWATCH_ONLY"){
                form.style.display = "none";
                const manualInputBackgroundTrello = $(".input-button-link");
                if(manualInputBackgroundTrello) manualInputBackgroundTrello.style.display = "none";    
            }else{
                form.style.display = "inline-block";
                const manualInputBackgroundTrello = $(".input-button-link");
                if(manualInputBackgroundTrello) manualInputBackgroundTrello.style.display = "inline-block";    
            }
            }
        )
        form.onsubmit = async (e) => {
            e.preventDefault();
            let workspaceSettings = await localStorage.getItem('workspaceSettings');
            workspaceSettings = JSON.parse(workspaceSettings);
            if (!workspaceSettings?.features?.timeTracking) {
                const isUserOwnerOrAdmin = await localStorage.getItem('isUserOwnerOrAdmin');
                const wasRegionalEverAllowed = await localStorage.getItem('wasRegionalEverAllowed');
                alert(!wasRegionalEverAllowed ? clockifyLocales.UPGRADE_TO_USE_THIS_FEATURE : isUserOwnerOrAdmin ? clockifyLocales.SUBSCRIPTION_EXPIRED : clockifyLocales.FEATURE_DISABLED_CONTACT_ADMIN);
                return;
            }

            //remove form if force timer enabled
            // format options so that if a function is passed we get its return value 
            // as part of the options objects key value pairs
            const timeEntryOptionsInvoked = objInvokeIfFunction(options);
            try {
                const time = input.value;
                input.value = clockifyLocales.SUBMITTING;
                const m = time.match(/(?=.{2,})^(\d+d)?\s*(\d+h)?\s*(\d+m)?$/);
                if (m) {
                    var totalMins = 8 * 60 * parseInt(m[1] || 0, 10) +
                        60 * parseInt(m[2] || 0, 10) +
                        parseInt(m[3] || 0, 10);
                        aBrowser.storage.local.get(["wsSettings"], (result) => {
                            let {wsSettings} = result;
                            // ClockifyPopupDlg.prototype.wsSettings = result.wsSettings;
                            if((result.wsSettings.forceDescription && !timeEntryOptionsInvoked.description) 
                                || wsSettings.forceProjects || wsSettings.forceTasks || wsSettings.forceTags){

                                if(timeEntryOptionsInvoked.projectName){  
                                    aBrowser.runtime.sendMessage({eventName: 'generateManualEntryData', options: timeEntryOptionsInvoked }).then((response) => {
                                        let timeEntry = {
                                            ...timeEntryOptionsInvoked, 
                                            totalMins,
                                            originalInput : time,
                                            projectId : !response.task?.id && wsSettings.forceTasks ? null : response.project?.id, 
                                            taskId: response.task?.id,
                                            billable : response.project?.billable,
                                            tags: response.tags,
                                            tagIds: response.tags?.map(tag => tag.id) ?? [],
                                            project: response.project,
                                            task: response.task
                                        }
                                        // OpenPostStartPopupDlg(timeEntry, "", true);
                                        window.updateButtonProperties(null, {timeEntry, manualMode: true, isPopupOpen: true});
                                        input.value = "";
                                    })
                                }else{
                                    aBrowser.runtime.sendMessage({
                                        eventName: 'getDefaultProjectTask'
                                    }).then((response) => {
                                        let timeEntry = {
                                            ...timeEntryOptionsInvoked, 
                                            totalMins,
                                            originalInput : time,
                                            projectId : response.projectDB?.id, 
                                            taskId: response.taskDB?.id,
                                            billable : response.projectDB?.billable,
                                            project: response.projectDB,
                                            task: response.taskDB
                                        }
                                        // OpenPostStartPopupDlg(timeEntry, "", true);
                                        window.updateButtonProperties(null, {timeEntry, manualMode: true, isPopupOpen: true});
                                        input.value = "";
                                    });
                                }    
                            } else {
                                inputMessage(input, clockifyLocales.SUBMITTING);
                                aBrowser.runtime.sendMessage({
                                    eventName: 'submitTime',
                                    options: {
                                        totalMins,
                                        timeEntryOptions: timeEntryOptionsInvoked
                                    }
                                }, (response) => {
                                    input.value = "";
                                    if (!response) {
                                        inputMessage(input, "Error: " + (response??''), "error");
                                    }
                                    else if (typeof response === "string") {
                                        alert(response)
                                        //inputMessage(input, "Error: " + (response??''), "error");
                                    }
                                    else if (response.status !== 201) {
                                        if (response.status === 400) {
                                            // project/task/etc. can be configured to be mandatory; this can result in a code 400 during
                                            // time entry creation
                                            if (response.endInProgressStatus) {
                                                inputMessage(input, "Error: " + (response.status), "error");
                                                alert(`${clockifyLocales.YOU_ALREADY_HAVE_ENTRY_WITHOUT}.\n${clockifyLocales.PLEASE_EDIT_YOUR_TIME_ENTRY}.`);
                                            }
                                            else {
                                                alert(clockifyLocales.CANNOT_START_ENTRY_WITHOUT_PROJECT);
                                            }
                                        }
                                    } else {
                                        inputMessage(input, clockifyLocales.TIME_ADDED, "success");
                                    }
                                });
                            }
                        })
                    } else {
                        inputMessage(input, "Format: 1d 2h 30m", "error");
                    }
                } catch (e) {
                    console.error(e);
                }
    
                // don't reload the page
                return false;
            };
        return form;
    }
};

function objectFromParams(description, project, task) {
    if (typeof description === 'object') {
        // mode: only one parameter that contains the options
        return description;
    } else {
        // legacy mode: multiple parameters
        return {
            description: description || "",
            projectName: project || null,
            taskName: task || null,
            billable: null
        };
    }
}

function $(s, elem) {
    elem = elem || document;
    return elem.querySelector(s);
}

function $$(s, elem) {
    elem = elem || document;
    return elem.querySelectorAll(s);
}

function invokeIfFunction(trial) {
    if (trial instanceof Function) {
        return trial();
    }
    return trial;
}

function objInvokeIfFunction(obj) {
    const result = {};
    for (const key of Object.keys(obj)) {
        result[key] = invokeIfFunction(obj[key]);
    }
    return result;
}

function createTag(name, className, textContent) {
    const tag = document.createElement(name);
    tag.className = className;

    if (textContent) {
        tag.textContent = textContent;
    }

    return tag;
}

function inputMessage(input, msg, type, clearInput = false) {
    input.readOnly = true;
    const oldValue = input.value;
    input.classList.remove("clockify-input-default");
    input.classList.remove("clockify-input-error");
    input.classList.remove("clockify-input-success");
    input.classList.add("clockify-input-" + type);
    input.value = msg;

    setTimeout(() => {
        input.value = clearInput ? "" : oldValue;
        input.classList.remove("clockify-input-default");
        input.classList.remove("clockify-input-error");
        input.classList.remove("clockify-input-success");
        input.classList.add("clockify-input-default");
        input.readOnly = false;
    }, 1500);
}

function setButtonProperties(button, title, active, buttonId = 0) {
    // while(button.firstChild) {
    //     button.removeChild(button.firstChild)
    // }
    
    // const span = document.createElement('span');
    button.title = title;
    button.classList.add('clockifyButton');
    button.classList.add('clockifyButtonId' + buttonId);
    
    if (active) {
        // button.classList.remove('clockify-button-inactive');
        // button.classList.add('clockify-button-active');
        // button.innerHTML = getActiveIcon();
        if (!button.classList.contains('small')) {
            // span.innerHTML = clockifyLocales.STOP_TIMER;
            // span.classList.remove('clockify-button-inactive-span');
            // span.classList.add('clockify-button-active-span');
            // button.appendChild(span);
            button.setAttribute('id', 'clockifyButton');
        } else {
            button.setAttribute('id', 'clockifySmallButton');
        }
    } else {
        // button.classList.remove('clockify-button-active');
        // button.classList.add('clockify-button-inactive');
        // button.innerHTML = getInactiveIcon();
        if (!button.classList.contains('small')) {
            // span.innerHTML = clockifyLocales.START_TIMER;
            // span.classList.remove('clockify-button-active-span');
            // span.classList.add('clockify-button-inactive-span');
            // button.appendChild(span);
            button.setAttribute('id', 'clockifyButton');
        } else {
            button.setAttribute('id', 'clockifySmallButton');
        }
    }

    window.updateButtonProperties({ 
        title, 
        active, 
        small: button.classList.contains('small'),
        buttonId
    }, {
        inProgressDescription: clockifyButton.inProgressDescription
    });
}

function updateButtonState(entry) {
    let button;
    clockifyButton.inProgressDescription = entry && entry.id ? entry.description : "";

    if (!document.clockifyButtonLinks)
        return;

    for (let i = 0; i < document.clockifyButtonLinks.length; i++) {
        button = document.clockifyButtonLinks[i];
        const buttonId = button.className.match(/clockifyButtonId(\d+)/)[1];
        const title = button.title || button.dataset.title; // fix for Zoho Desk bug with disappearing title atributte
        const active = entry && title === entry.description;
        this.setButtonProperties(button, title, active, buttonId);
        if (button.onEntryChanged)
            button.onEntryChanged(entry);
    }

}

async function hideClockifyButtonLinks() {
    const styles = '#clockifyButton,#clockify-manual-input-form{ display: none !important; }';
    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

function setClockifyButtonLinks(button) {
    document.clockifyButtonLinks = document.clockifyButtonLinks ? document.clockifyButtonLinks : [];
    document.clockifyButtonLinks.push(button)
}

// function buttonClicked(button,  options) {
//     if (_waitingForResponse) {
//         return;
//     }
//     const timeEntryOptionsInvoked = objInvokeIfFunction(options);
//     const title = button.title || timeEntryOptionsInvoked.description;

//     _waitingForResponse = true;
//     try {
//         if (title === clockifyButton.inProgressDescription) {
//             aBrowser.runtime.sendMessage({
//                 eventName: 'endInProgress'
//             }, (response) => {
//                 if (!response) {
//                     _waitingForResponse = false;
//                     alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
//                     // this.hideClockifyButtonLinks();
//                     return;
//                 }
//                 else if (typeof response === 'string') {
//                     //alert("ClockifyService is temporarily unavailable.");
//                     _waitingForResponse = false;
//                     alert(response);
//                     return;
//                 }
//                 if (response.status === 400) {
//                     const msg = clockifyLocales.CANNOT_END_ENTRY;
//                     if (_clockifyShowPostStartPopup) {

//                         aBrowser.runtime.sendMessage({
//                             eventName: 'fetchEntryInProgress'  
//                         }, (response) => {
//                             if (!response) {
//                                 alert(clockifyLocales.TAG__GET__ERROR);
//                                 _waitingForResponse = false;
//                                 return;
//                             }
//                             if (typeof response === 'string') {
//                                 alert(response);
//                                 _waitingForResponse = false;
//                                 return;
//                             }
//                             const { status, entry: hydratedEntry } = response;
                            
//                             aBrowser.storage.local.set({
//                                 timeEntryInProgress: hydratedEntry
//                             });
//                             if (hydratedEntry) {
//                                 if (!_clockifyPopupDlg) {
//                                     OpenPostStartPopupDlg(hydratedEntry, msg);
//                                 } 
//                                 else {
//                                     alert(msg)
//                                 }
//                             }                          
//                             _waitingForResponse = false;
//                         });
//                     }
//                     else {
//                         _waitingForResponse = false;
//                         alert(msg);
//                     }
//                 } else {
//                     clockifyButton.inProgressDescription = null;
//                     active = false;
//                     setButtonProperties(button, title, active);
//                     aBrowser.storage.local.set({
//                         timeEntryInProgress: null
//                     });
//                     _waitingForResponse = false;
//                 }
//             });    
//         } 
//         else {
//             if (timeEntryOptionsInvoked.description === "") {
//                 alert(clockifyLocales.ENTER_DESCRIPTION);
//                 _waitingForResponse = false; // ?
//                 return;
//             }
//             aBrowser.runtime.sendMessage({
//                 eventName: 'startWithDescription',
//                 timeEntryOptions: timeEntryOptionsInvoked
//             }, (response) => {
//                 if (!response) {
//                     _waitingForResponse = false;
//                     alert(clockifyLocales.YOU_MUST_BE_LOGGED_IN_TO_START);
//                     return;
//                 }
//                 else if (typeof response === 'string') {
//                     _waitingForResponse = false;
//                     alert(response);
//                     return;
//                 }
//                 if (response.status === 400) {
//                     if (_clockifyShowPostStartPopup) {
//                         const msg = `${clockifyLocales.COMPLETE_CURRENT_ENTRY}!<br/>${clockifyLocales.ENTER_REQUIRED_FIEEDS_OR_EDIT_WORKSPACE_SETTINGS}`;
//                         aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
//                             const {timeEntryInProgress} = result;
//                             if (timeEntryInProgress) {
//                                 if (!_clockifyPopupDlg) {
//                                     OpenPostStartPopupDlg(timeEntryInProgress, msg);
//                                 }
//                             }
//                             else {
//                                 alert(msg.replaceAll('<br/>', '\n'));
//                             }
//                             _waitingForResponse = false;
//                         });
//                     }
//                     else {
//                         msg = clockifyLocales.CANNOT_START_ENTRY_WITHOUT_PROJECT +
//                         ". " + clockifyLocales.EDIT_YOUR_TIME_ENTRY + 
//                         ". " + clockifyLocales.CREATE_TIME_ENTRY_USING_DASHBOARD + ".";
//                         alert(msg);
//                         _waitingForResponse = false;
//                     }
//                 } 
//                 else {
//                     let doNow = true;
//                     active = true;
//                     setButtonProperties(button, title, active);
//                     clockifyButton.inProgressDescription = title;
//                     const entry = response.data;
//                     const {tagNames} = timeEntryOptionsInvoked;
//                     if (tagNames && tagNames.length > 0 && entry.tags.length > 0) {
//                         doNow = false;
//                         aBrowser.runtime.sendMessage({
//                             eventName: 'fetchEntryInProgress'  
//                         }, (response) => {
//                             if (!response) {
//                                 alert(clockifyLocales.TAG__GET__ERROR);
//                                 _waitingForResponse = false;
//                                 return;
//                             }
//                             if (typeof response === 'string') {
//                                 alert(response);
//                                 _waitingForResponse = false;
//                                 return;
//                             }
//                             const { status, entry: hydratedEntry } = response;
//                             entry.tags = [...hydratedEntry.tags]
//                             doTheJob(entry) // hydrated
//                             _waitingForResponse = false;
//                         });
//                     }                    
    
//                     if (doNow) {
//                         _waitingForResponse = false;
//                         doTheJob(entry)
//                     }
//                 }
//             });
//         }
//     }
//     catch(error) {
//         if (error.toString().toLowerCase().includes("extension context invalidated")) {
//             alert(`${clockifyLocales.EXT_RELOADED}.\n${clockifyLocales.REFRESH_THE_PAGE}!`)
//         }
//         else {
//             alert(`${clockifyLocales.EXT_CONTEXT_INVALIDATED}.\n${clockifyLocales.REFRESH_THE_PAGE}!`)
//         }
//     }
//     finally{
//         _waitingForResponse = false;
//     }
// }

// function doTheJob(entry) {
//     aBrowser.storage.local.set({
//         timeEntryInProgress: entry
//     });
//     if (_clockifyShowPostStartPopup)
//         OpenPostStartPopupDlg(entry);   
// }


// function OpenPostStartPopupDlg(timeEntry, msg, manualMode = false) {
//     if (timeEntry) {
//         if (timeEntry.message)
//             alert(timeEntry.message)
//         _clockifyPopupDlg = new ClockifyPopupDlg();
//         aBrowser.storage.local.get(['userRoles'], (result) => {
//              _clockifyPopupDlg.userRoles = result.userRoles;
//         })

//         _clockifyPopupDlg.wsCustomFields = [];     
//         if (ClockifyEditForm.userHasCustomFieldsFeature) {
//             aBrowser.runtime.sendMessage({
//                 eventName: 'getWSCustomField',
//                 options: {}
//             }, (response) => {
//                 if (response) {
//                     const { data, status } = response;
//                     if (status !== 200) {
//                         if (status === 403) {
//                             alert(clockifyLocales.WORKSPACE_NOT_AUTHORIZED_FOR_CUSTOM_FIELDS)
//                         }
//                     } 
//                     else {
//                         _clockifyPopupDlg.wsCustomFields = data;
//                         _clockifyPopupDlg.injectLinkModal();
//                     }
//                 }
//                 document.body.appendChild(_clockifyPopupDlg.create(timeEntry, msg, manualMode));
//             });           
//         }
//         else {
//             document.body.appendChild(_clockifyPopupDlg.create(timeEntry, msg, manualMode));
//         }
        
//         if(window.clockifyListeners){
//             window.addEventListener('click', window.clockifyListeners.clockifyClicks, true);
//             window.addEventListener('change', window.clockifyListeners.clockifyChanges, true);
//             document.addEventListener('click', window.clockifyListeners.clockifyRemovePopupDlg, true);
//             window.addEventListener('resize', window.clockifyListeners.clockifyTrackResize, true);
//             window.addEventListener('scroll', window.clockifyListeners.clockifyTrackScroll, true); 
//         }
//     }    
// } 

if(!window.clockifyListeners) {
    window.clockifyListeners = {
        clockifyClicks: function (e) {
            const divPopupDlg = document.getElementById('divClockifyPopupDlg');
            if (!divPopupDlg)
                return;

            if (divPopupDlg.contains(e.target)) {
                _clockifyPopupDlg.onClicked(e.target);
                e.stopPropagation();
                if (e.target && (e.target.tagName === "A" ||
                                e.target.id.startsWith('switchbox') ||
                                e.target.id.startsWith('txtCustomField') )) {
                }
                else {
                    e.preventDefault();
                }
            }
            else {
                const div = document.getElementById('divClockifyProjectDropDownPopup');
                if (div && div.contains(e.target)) {
                    _clockifyPopupDlg.onClickedProjectDropDown(e.target);
                    e.stopPropagation();
                    e.preventDefault();
                }
                else {
                    const div = document.getElementById('divClockifyTagDropDownPopup');
                    if (div && div.contains(e.target)) {
                        _clockifyPopupDlg.onClickedTagDropDown(e.target);
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    else {
                        const div = document.getElementById('divClockifyLinkModal');
                        if (div && div.style.display !== 'none') {
                            _clockifyPopupDlg.onClickedLinkModal(div, e.target);
                            e.stopPropagation();
                            e.preventDefault();
                        }
                        else {
                            // custom fields popups
                            if (_clockifyPopupDlg.onClickedCFPopup(e.target)) {
                                e.stopPropagation();
                                e.preventDefault();
                            }
                        }
                    }
                }
            }
    },
    clockifyChanges: function (e) {
        const divPopupDlg = document.getElementById('divClockifyPopupDlg');
        if (e.target && e.target.id === 'txtCustomFieldLinkModal') {
            document.querySelector('.clockify-save').classList.remove('clockify-save--disabled');
            e.stopPropagation();
            e.preventDefault();
        }
        else if ((divPopupDlg && divPopupDlg.contains(e.target))) {
            _clockifyPopupDlg.onChanged(e.target);
            e.stopPropagation();
            e.preventDefault();
        }
    },
    clockifyRemovePopupDlg: function (e) {
        const divPopupDlg = document.getElementById('divClockifyPopupDlg');
        if (divPopupDlg && !divPopupDlg.contains(e.target)) {
            const divProjectDropDownPopup = document.getElementById('divClockifyProjectDropDownPopup');
            const divTagDropDownPopup = document.getElementById('divClockifyTagDropDownPopup');
            if (divProjectDropDownPopup && divProjectDropDownPopup.contains(e.target) ||
                divTagDropDownPopup && divTagDropDownPopup.contains(e.target))
                return;
            clockifyDestroyPopupDlg();
        }
    },
    clockifyTrackResize: function () {
        if (_clockifyPopupDlg)
            clockifyRepositionDropDown();
    },
    clockifyTrackScroll: function () {
        if (_clockifyPopupDlg)
            clockifyRepositionDropDown();
        }
    }
}

function removeAllButtons(wrapperClass) {
    document.querySelectorAll(wrapperClass || '.clockifyButton, #clockify-manual-input-form').forEach(el => {
        el.parentNode.removeChild(el);
    });

    document.querySelectorAll('.clockify').forEach(el => {
        el.classList.remove('clockify');
    });
}


function clockifyDestroyPopupDlg() {
    const divPopupDlg = document.getElementById('divClockifyPopupDlg');
    if (divPopupDlg) {
        if(window.clockifyListeners){
            window.removeEventListener('click', window.clockifyListeners.clockifyClicks, true);
            window.removeEventListener('change', window.clockifyListeners.clockifyChanges, true);
            window.removeEventListener('resize', window.clockifyListeners.clockifyTrackResize, true);
            window.removeEventListener('scroll', window.clockifyListeners.clockifyTrackScroll, true);
            _clockifyPopupDlg.destroy();
            document.body.removeChild(divPopupDlg);
            document.removeEventListener('click', window.clockifyListeners.clockifyRemovePopupDlg, true);
            
            _clockifyPopupDlg = null;
        }
    }
}

function clockifyRepositionDropDown() {
    const divPopup = document.getElementById('divClockifyProjectDropDownPopup');
    if (divPopup) {
        _clockifyProjectList.repositionDropDown();
    }
    else {
        const divPopup = document.getElementById('divClockifyTagDropDownPopup');
        if (divPopup) {
            _clockifyTagList.repositionDropDown();
        }
        else {
            // custom fields popups
            if (_clockifyPopupDlg.repositionDropDownCF()) {
            }
        }        
    }
}

function onChangedListener(changes) {
    const changedItems = Object.keys(changes);
    if (changedItems.find(item => item === 'timeEntryInProgress')) {       
        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
            const {timeEntryInProgress} = result;
            this.updateButtonState(timeEntryInProgress);
        });
    }

    if (changedItems.find(item => item === 'token')) {
        aBrowser.storage.local.get(["token"], (result) => {
            if (!result.token) {
                this.hideClockifyButtonLinks()
            }
            else {
            }
        })
    }

    if (changedItems.find(item => item === 'showPostStartPopup')) {
        aBrowser.storage.local.get(["showPostStartPopup"], (result) => {
            _clockifyShowPostStartPopup = result.showPostStartPopup;
        })
    }

    if (changedItems.find(item => item === 'wsSettings')) {
        if (_clockifyShowPostStartPopup) {
            aBrowser.storage.local.get(["wsSettings"], (result) => {
                ClockifyEditForm.prototype.wsSettings = result.wsSettings;
            })
        }
    }

    if (changedItems.find(item => item === 'workspaceSettings')) {
        aBrowser.storage.local.get(["workspaceSettings"], (result) => {
            if(result.workspaceSettings){
                const settings = JSON.parse(result.workspaceSettings);
                if(settings.timeTrackingMode === "STOPWATCH_ONLY"){
                    const manualInputForm = $("#clockify-manual-input-form");
                    const manualInputBackgroundTrello = $(".input-button-link");
                    if(manualInputForm) manualInputForm.style.display = "none";
                    if(manualInputBackgroundTrello) manualInputBackgroundTrello.style.display = "none";
                }else{
                    const manualInputForm = $("#clockify-manual-input-form");
                    if(manualInputForm) manualInputForm.style.display = "inline-block";
                    const manualInputBackgroundTrello = $(".input-button-link");
                    if(manualInputBackgroundTrello) manualInputBackgroundTrello.style.display = "inline-block";
                }
            }
        })
    }

    if (changedItems.find(item => item === 'integrationAlert')) {
        aBrowser.storage.local.get(["integrationAlert"], (result) => {
            if(result.integrationAlert){
                alert(result.integrationAlert);
                aBrowser.storage.local.set({'integrationAlert': ''});
            }
        })
    }

}

aBrowser.storage.onChanged.addListener(onChangedListener);

function cleanup () {
    aBrowser.storage.onChanged.removeListener(onChangedListener);
    aBrowser.runtime.onMessage.removeListener(onMessageListener);
}

function onMessageListener (request) {
    if (request.eventName === 'cleanup') {
        cleanup();
    }
}

aBrowser.runtime.onMessage.addListener(onMessageListener)