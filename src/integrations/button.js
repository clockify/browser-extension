var aBrowser = chrome || browser;
var clockifyButton = {
    links: [],
    inProgressDescription: "",
    render: (selector, opts, renderer, mutationSelector) => {
        if (opts.observe) {
            const observer = new MutationObserver((mutations) => {
                if (mutationSelector) {
                    const matches = mutations.filter(function (mutation) {
                        return mutation.target.matches(mutationSelector);
                    });
                    if (!matches.length) {
                        return;
                    }
                }
                clockifyButton.renderTo(selector, renderer);
            });
            observer.observe(document, {childList: true, subtree: true});
        } else {
            clockifyButton.renderTo(selector, renderer);
        }
    },
    renderTo: (selector, renderer) => {
        for (const element of document.querySelectorAll(selector)) {
            element.classList.add('clockify');
            renderer(element);
        }
    },

    createButton: (description, project, task) => {
        const options = objectFromParams(description, project, task);
        const button = document.createElement('a');

        if (invokeIfFunction(options.small)) {
            button.classList.add('small');
        }
        const title = invokeIfFunction(options.description);
        fetchEntryInProgress(entry => {
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
            this.setClockifyButtonLinks(button)
        });
    
        button.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        button.onclick = () => this.buttonClicked(button, options)
        
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
                        totalMins: totalMins,
                        timeEntryOptions: timeEntryOptionsInvoked,
                    }, (response) => {
                        input.value = "";
                        if (!response || response.status !== 201) {
                            inputMessage(input, "Error: " + (response && response.status), "error");

                            if (response && response.status === 400) {
                                // project/task/etc. can be configured to be mandatory; this can result in a code 400 during
                                // time entry creation
                                alert("Can't log time without project/task/description or tags.");
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

function fetchEntryInProgress(callback) {
    aBrowser.runtime.sendMessage({eventName: "getEntryInProgress"}, (response) => {
        callback(response)
    });
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
    for (let i = 0; i < document.clockifyButtonLinks.length; i++) {
        button = document.clockifyButtonLinks[i];
        const active = entry && button.title === entry.description;

        this.setButtonProperties(button, button.title, active);
    }
}

function hideClockifyButtonLinks() {
    if (!document.clockifyButtonLinks) return
    for (let i = 0; i < document.clockifyButtonLinks.length; i++) {
        document.clockifyButtonLinks[i].setAttribute('style', 'visibility: hidden')
    }
}

function setClockifyButtonLinks(button) {
    document.clockifyButtonLinks = document.clockifyButtonLinks ? document.clockifyButtonLinks : [];
    document.clockifyButtonLinks.push(button)
}

function buttonClicked(button, options) {
    const timeEntryOptionsInvoked = objInvokeIfFunction(options);
    const title = timeEntryOptionsInvoked.description;
    if (title && title === clockifyButton.inProgressDescription) {
        aBrowser.runtime.sendMessage({eventName: 'endInProgress'}, (response) => {
            if (!response) {
                alert("You must be logged in to stop time entry.");
                this.hideClockifyButtonLinks()
                return;
            }
            if (response.status === 400) {
                alert("Can't end entry without project/task/description or tags. Please edit your time entry.");
            } else {
                clockifyButton.inProgressDescription = null;
                active = false;
                setButtonProperties(button, title, active);
                aBrowser.storage.local.set({
                    timeEntryInProgress: null
                });
            }
        });
    } else {
        aBrowser.runtime.sendMessage({
            eventName: 'startWithDescription',
            timeEntryOptions: timeEntryOptionsInvoked
        }, (response) => {
            if (!response) {
                alert("You must be logged in to start time entry.");
                this.hideClockifyButtonLinks()
                return;
            }
            if (response.status === 400) {
                alert("Can't start entry without project/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.");
            } else {
                active = true;
                setButtonProperties(button, title, active);
                clockifyButton.inProgressDescription = title;
                aBrowser.storage.local.set({
                    timeEntryInProgress: response.data
                });
            }
        });
    }
}

function getActiveIcon() {
    return '<svg viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#222222"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#03A9F4"></path></svg>'
}

function getInactiveIcon() {
    return '<svg viewbox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="16" width="16"><path d="m 10.461549,5.5284395 3.642277,-3.6422765 1.040649,1.0406505 -3.642276,3.642309 z M 8.9656137,9.3008298 c -0.7154471,0 -1.300813,-0.5853659 -1.300813,-1.300813 0,-0.7154472 0.5853659,-1.300813 1.300813,-1.300813 0.7154472,0 1.3008133,0.5853658 1.3008133,1.300813 0,0.7154471 -0.5853661,1.300813 -1.3008133,1.300813 z m 6.2439023,3.7723572 -1.04065,1.04065 -3.642276,-3.642276 1.04065,-1.0407149 z" fill="#444444"></path><path d="m 9.0306543,13.593496 c 0.7154472,0 1.4308947,-0.130081 2.0813017,-0.390244 l 1.821138,1.821139 C 11.762362,15.674797 10.461549,16 9.095695,16 4.6729307,16 1.0956949,12.422765 1.0956949,8.0000004 1.0956949,3.5772361 4.6729307,3.65e-7 9.095695,3.65e-7 c 1.430895,0 2.731708,0.390243865 3.837399,0.975609665 L 11.176996,2.7317077 C 10.52659,2.4715451 9.8111421,2.3414637 9.095695,2.3414637 c -3.1219513,0 -5.593496,2.5365854 -5.593496,5.593496 -0.06504,3.1219513 2.4065041,5.6585363 5.5284553,5.6585363 z" fill="#444444;"></path></svg>'
}

aBrowser.storage.onChanged.addListener((changes, area) => {
    const changedItems = Object.keys(changes);

    if (changedItems.filter(item => item === 'timeEntryInProgress').length > 0) {
        aBrowser.storage.local.get(["timeEntryInProgress"], (result) => {
            this.updateButtonState(result.timeEntryInProgress);
        });
    }

    if (changedItems.filter(item => item === 'token').length > 0) {
        aBrowser.storage.local.get(["token"], (result) => {
            if (!result.token) {
                this.hideClockifyButtonLinks()
            }
        })
    }
});



