var aBrowser = chrome || browser;
var _clockifyPopupDlg;
var _waitingForResponse = false;

var clockifyButton = {
    links: [],
    observer: null,
    inProgressDescription: "",
    render: (selector, opts, renderer, mutationSelector) => {
        if (opts.observe) {
            if (!clockifyButton.observer) {
                clockifyButton.observer = new MutationObserver(clockifyDebounce(clockifyButton.callback, 1000));
                clockifyButton.observer.observe(
                    document,
                    {childList: true, subtree: true}
                );
            }
            clockifyButton.allSelectors.push({selector, renderer, mutationSelector})
        }
        else {
            clockifyButton.renderTo(selector, renderer);
        }
    },
    renderTo: (selector, renderer) => {
        const elements = document.querySelectorAll(selector);
        if (elements && elements.length > 0) {
            for (let i = 0; i < elements.length; i++) {
                elements[i].classList.add('clockify');
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
        clockifyButton.observer.disconnect()
    },

    createButton: (description, project, task, canClose) => {
        const options = objectFromParams(description, project, task);
        const button = document.createElement('a');
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
            setButtonProperties(button, title, active);
            
            if (options.canClose)
                button.canClose = options.canClose;

            this.setClockifyButtonLinks(button)
        });
    
        button.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        button.onclick = () => {
            if (button.canClose && !button.canClose())
                return;
            this.buttonClicked(button, options)
        }
        
        return button;
    },

    createSmallButton: (description, project) => {
        const options = objectFromParams(description, project);
        options.small = true;

        return clockifyButton.createButton(options);
    },

    createInput: (options) => {
        const form = document.createElement('form');
        const input = document.createElement('input');
        input.classList.add("clockify-input");
        input.classList.add("clockify-input-default");
        input.setAttribute("placeholder", "Add time (eg. 15m)");

        form.appendChild(input);

        form.onsubmit = (a) => {
            const timeEntryOptionsInvoked = objInvokeIfFunction(options);
            try {
                const time = input.value;
                const m = time.match(/^(\d+d)?\s*(\d+h)?\s*(\d+m)?$/);
                if (m) {
                    input.readOnly = true;
                    input.value = "Submitting...";

                    var totalMins = 8 * 60 * parseInt(m[1] || 0, 10) +
                        60 * parseInt(m[2] || 0, 10) +
                        parseInt(m[3] || 0, 10);
                    
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
                            inputMessage(input, "Error: " + (response.status), "error");
                            if (response.status === 400) {
                                // project/task/etc. can be configured to be mandatory; this can result in a code 400 during
                                // time entry creation
                                if (response.endInProgressStatus) {
                                    alert("You already have entry in progress\nwithout project/task/description or tags.\nPlease edit your time entry.");
                                }
                                else {
                                    alert("Can't create Time Entry without project/task/description or tags.");
                                }
                            }
                        } else {
                            inputMessage(input, "Time added!", "success");
                        }
                    });
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

function inputMessage(input, msg, type) {
    input.readOnly = true;
    const oldValue = input.value;
    input.classList.remove("clockify-input-default");
    input.classList.remove("clockify-input-error");
    input.classList.remove("clockify-input-success");
    input.classList.add("clockify-input-" + type);
    input.value = msg;

    setTimeout(() => {
        input.value = oldValue;
        input.classList.remove("clockify-input-default");
        input.classList.remove("clockify-input-error");
        input.classList.remove("clockify-input-success");
        input.classList.add("clockify-input-default");
        input.readOnly = false;
    }, 1000);
}

function setButtonProperties(button, title, active) {
    while(button.firstChild) {
        button.removeChild(button.firstChild)
    }
    
    const span = document.createElement('span');
    button.title = title;
    
    if (active) {
        button.classList.remove('clockify-button-inactive');
        button.classList.add('clockify-button-active');
        button.innerHTML = getActiveIcon();
        if (!button.classList.contains('small')) {
            span.innerHTML = 'Stop timer';
            span.classList.remove('clockify-button-inactive-span');
            span.classList.add('clockify-button-active-span');
            button.appendChild(span);
            button.setAttribute('id', 'clockifyButton');
        } else {
            button.setAttribute('id', 'clockifySmallButton');
        }
    } else {
        button.classList.remove('clockify-button-active');
        button.classList.add('clockify-button-inactive');
        button.innerHTML = getInactiveIcon();
        if (!button.classList.contains('small')) {
            span.innerHTML = 'Start timer';
            span.classList.remove('clockify-button-active-span');
            span.classList.add('clockify-button-inactive-span');
            button.appendChild(span);
            button.setAttribute('id', 'clockifyButton');
        } else {
            button.setAttribute('id', 'clockifySmallButton');
        }
    }
}

function updateButtonState(entry) {
    let button;
    clockifyButton.inProgressDescription = entry && entry.id ? entry.description : "";

    if (!document.clockifyButtonLinks)
        return;

    for (let i = 0; i < document.clockifyButtonLinks.length; i++) {
        button = document.clockifyButtonLinks[i];
        const active = entry && button.title === entry.description;
        this.setButtonProperties(button, button.title, active);
        if (button.onEntryChanged)
            button.onEntryChanged(entry);
    }
}

function hideClockifyButtonLinks() {
    if (!document.clockifyButtonLinks)
        return;
    for (let i = 0; i < document.clockifyButtonLinks.length; i++) {
        document.clockifyButtonLinks[i].setAttribute('style', 'visibility: hidden')
    }
}

function setClockifyButtonLinks(button) {
    document.clockifyButtonLinks = document.clockifyButtonLinks ? document.clockifyButtonLinks : [];
    document.clockifyButtonLinks.push(button)
}

function buttonClicked(button, options) {
    if (_waitingForResponse) {
        return;
    }

    const timeEntryOptionsInvoked = objInvokeIfFunction(options);
    const title = timeEntryOptionsInvoked.description;

    _waitingForResponse = true;
    try {
        if (title && title === clockifyButton.inProgressDescription) {
            aBrowser.runtime.sendMessage({
                eventName: 'endInProgress'
            }, (response) => {
                if (!response) {
                    _waitingForResponse = false;
                    alert("You must be logged in to stop time entry (endInProgress).");
                    // this.hideClockifyButtonLinks();
                    return;
                }
                else if (typeof response === 'string') {
                    //alert("ClockifyService is temporarily unavailable.");
                    _waitingForResponse = false;
                    alert(response);
                    return;
                }
                if (response.status === 400) {
                    //const msg = "Can't end entry without project, task, description or tags. Please edit your time entry.";
                    const msg = "Can't end entry. Please enter required fields in your time entry.";
                    if (_clockifyShowPostStartPopup) {
                        // aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
                        //     const {timeEntryInProgress} = result;
                        //     if (timeEntryInProgress) {
                        //         if (!_clockifyPopupDlg) {
                        //             OpenPostStartPopupDlg(timeEntryInProgress, msg);
                        //         } 
                        //         else {
                        //             alert(msg)
                        //         }
                        //     }
                        //     else {
                        //         alert('Please, enter required fields and end current Entry!')
                        //     }
                        //     _waitingForResponse = false;
                        // });

                        aBrowser.runtime.sendMessage({
                            eventName: 'fetchEntryInProgress'  
                        }, (response) => {
                            if (!response) {
                                alert("Tag list problem");
                                _waitingForResponse = false;
                                return;
                            }
                            if (typeof response === 'string') {
                                alert(response);
                                _waitingForResponse = false;
                                return;
                            }
                            const { status, entry: hydratedEntry } = response;
                            //entry.tags = [...hydratedEntry.tags]
                            aBrowser.storage.local.set({
                                timeEntryInProgress: hydratedEntry
                            });
                            if (hydratedEntry) {
                                if (!_clockifyPopupDlg) {
                                    OpenPostStartPopupDlg(hydratedEntry, msg);
                                } 
                                else {
                                    alert(msg)
                                }
                            }
                            else {
                                alert('Please, enter required fields and end current Entry!')
                            }                           
                            _waitingForResponse = false;
                        });
                    }
                    else {
                        _waitingForResponse = false;
                        alert(msg);
                    }
                } else {
                    clockifyButton.inProgressDescription = null;
                    active = false;
                    setButtonProperties(button, title, active);
                    aBrowser.storage.local.set({
                        timeEntryInProgress: null
                    });
                    _waitingForResponse = false;
                }
            });    
        } 
        else {
            if (timeEntryOptionsInvoked.description === "") {
                alert("Please enter the Description.");
                _waitingForResponse = false; // ?
                return;
            }
            aBrowser.runtime.sendMessage({
                eventName: 'startWithDescription',
                timeEntryOptions: timeEntryOptionsInvoked
            }, (response) => {
                if (!response) {
                    _waitingForResponse = false;
                    alert("You must be logged in to start time entry. (startWithDescription)");
                    // this.hideClockifyButtonLinks();
                    return;
                }
                else if (typeof response === 'string') {
                    _waitingForResponse = false;
                    alert(response);
                    return;
                }
                if (response.status === 400) {
                    if (_clockifyShowPostStartPopup) {
                        const msg = "Please, first complete your current Entry!<br/>Enter required fields or optionally edit your workspace settings.";
                        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
                            const {timeEntryInProgress} = result;
                            if (timeEntryInProgress) {
                                if (!_clockifyPopupDlg) {
                                    OpenPostStartPopupDlg(timeEntryInProgress, msg);
                                }
                            }
                            else {
                                alert(msg.replaceAll('<br/>', '\n'));
                            }
                            _waitingForResponse = false;
                        });
                    }
                    else {
                        // const msg = "Can't start entry without project, task, description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.";
                        msg = "Can't start entry without project, task, description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.";
                        alert(msg);
                        _waitingForResponse = false;
                    }
                } 
                else {
                    let doNow = true;
                    active = true;
                    setButtonProperties(button, title, active);
                    clockifyButton.inProgressDescription = title;
                    const entry = response.data;
                    const {tagNames} = timeEntryOptionsInvoked;
                    if (tagNames && tagNames.length > 0 && entry.tagIds.length > 0) {
                        doNow = false;
                        aBrowser.runtime.sendMessage({
                            eventName: 'fetchEntryInProgress'  
                        }, (response) => {
                            if (!response) {
                                alert("Tag list problem");
                                _waitingForResponse = false;
                                return;
                            }
                            if (typeof response === 'string') {
                                alert(response);
                                _waitingForResponse = false;
                                return;
                            }
                            const { status, entry: hydratedEntry } = response;
                            entry.tags = [...hydratedEntry.tags]
                            doTheJob(entry) // hydrated
                            _waitingForResponse = false;
                        });
                    }                    
    
                    if (doNow) {
                        _waitingForResponse = false;
                        doTheJob(entry)
                    }
                }
            });
        }
    }
    catch(error) {
        if (error.toString().toLowerCase().includes("extension context invalidated")) {
            alert('Extension has been reloaded.\nPlease refresh the page!')
        }
        else {
            alert('Extension context invalidated.\nPlease refresh the page!')
        }
    }
    finally{
        _waitingForResponse = false;
    }
}

function doTheJob(entry) {
    aBrowser.storage.local.set({
        timeEntryInProgress: entry
    });
    if (_clockifyShowPostStartPopup)
        OpenPostStartPopupDlg(entry);   
}


function OpenPostStartPopupDlg(timeEntry, msg) {
    if (timeEntry) {
        if (timeEntry.message)
            alert(timeEntry.message)
        _clockifyPopupDlg = new ClockifyPopupDlg();
        aBrowser.storage.local.get(['userRoles'], (result) => {
             _clockifyPopupDlg.userRoles = result.userRoles;
             // console.log('OpenPostStartPopupDlg result.userRoles', result.userRoles, new Date().toISOString())
        })

        _clockifyPopupDlg.wsCustomFields = [];     
        if (ClockifyEditForm.userHasCustomFieldsFeature) {
            aBrowser.runtime.sendMessage({
                eventName: 'getWSCustomField',
                options: {}
            }, (response) => {
                if (response) {
                    const { data, status } = response;
                    if (status !== 200) {
                        if (status === 403) {
                            alert('Your Workspace is not authorized for Custom Fields')
                        }
                    } 
                    else {
                        _clockifyPopupDlg.wsCustomFields = data;
                        _clockifyPopupDlg.injectLinkModal();
                    }
                }
                document.body.appendChild(_clockifyPopupDlg.create(timeEntry, msg));
            });           
        }
        else {
            document.body.appendChild(_clockifyPopupDlg.create(timeEntry, msg));
        }
        
        //window.addEventListener('keydown', clockifyKeydowns, true);
        window.addEventListener('click', clockifyClicks, true);
        window.addEventListener('change', clockifyChanges, true);
        document.addEventListener('click', clockifyRemovePopupDlg, true);
        window.addEventListener('resize', clockifyTrackResize, true);
        window.addEventListener('scroll', clockifyTrackScroll, true);

        //document.addEventListener('selectionchange', clockifySelectionChange, true);
        //document.addEventListener('mouseup', clockifyMouseUp, true);
    }    
}

function clockifyClicks(e) {
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
}

function clockifyChanges(e) {
    const divPopupDlg = document.getElementById('divClockifyPopupDlg');
    if (divPopupDlg && divPopupDlg.contains(e.target)) {
        _clockifyPopupDlg.onChanged(e.target);
        e.stopPropagation();
        e.preventDefault();
    }
}


// function clockifyKeydowns(e) {
//     const divPopupDlg = document.getElementById('divClockifyPopupDlg');
//     if (divPopupDlg && divPopupDlg.contains(e.target)) {
//         //_clockifyPopupDlg.onKeydown(e.target);
//         alert(e.keyCode)
//         e.stopPropagation();
//         e.preventDefault();
//     }
// }


/*
function clockifySelectionChange(e) {
    console.log('clockifySelectionChange', e)
}
function clockifyMouseUp(e) {
    console.log('clockifyMouseUp', e)
    //if (e.target.id !== 'clockifyTextareaDescription') {
        e.stopPropagation();
        e.preventDefault();
    //}
}
*/



function clockifyRemovePopupDlg(e) {
    const divPopupDlg = document.getElementById('divClockifyPopupDlg');
    if (divPopupDlg && !divPopupDlg.contains(e.target)) {
        const divProjectDropDownPopup = document.getElementById('divClockifyProjectDropDownPopup');
        const divTagDropDownPopup = document.getElementById('divClockifyTagDropDownPopup');
        if (divProjectDropDownPopup && divProjectDropDownPopup.contains(e.target) ||
            divTagDropDownPopup && divTagDropDownPopup.contains(e.target))
            return;
        clockifyDestroyPopupDlg();
    }
}

function clockifyDestroyPopupDlg() {
    const divPopupDlg = document.getElementById('divClockifyPopupDlg');
    if (divPopupDlg) {
        window.removeEventListener('click', clockifyClicks, true);
        window.removeEventListener('change', clockifyChanges, true);
        window.removeEventListener('resize', clockifyTrackResize, true);
        window.removeEventListener('scroll', clockifyTrackScroll, true)
        _clockifyPopupDlg.destroy();
        document.body.removeChild(divPopupDlg);
        document.removeEventListener('click', clockifyRemovePopupDlg, true);
        //document.removeEventListener('selectionchange', clockifySelectionChange, true);
        //document.removeEventListener('mouseup', clockifyMouseUp, true);
        
        _clockifyPopupDlg = null;
    }
}

function clockifyTrackResize() {
    if (_clockifyPopupDlg)
        clockifyRepositionDropDown();
}

function clockifyTrackScroll() {
    if (_clockifyPopupDlg)
        clockifyRepositionDropDown();
}


function clockifyMouseWheel(e) {
    e.stopPropagation();
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

function getActiveIcon() {
    return '<svg viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#03A9F4"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#03A9F4"></path></svg>'
}

function getInactiveIcon() {
    return '<svg viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#5A6B7B"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#5A6B7B"></path></svg>'
}

aBrowser.storage.onChanged.addListener((changes, area) => {
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

});

