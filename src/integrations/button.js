var aBrowser = chrome || browser;
var clockifyButton = {
    links: [],
    inProgressDescription: "",
    beforeRender: (next) => {
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
            next();
        });
    },
    render: (selector, opts, renderer, mutationSelector) => {
        clockifyButton.beforeRender(() => {
            if (opts.observe) {
                const observer = new MutationObserver(function (mutations) {
                    if (!!mutationSelector) {
                        return;
                    }

                    const matches = mutations.filter(function (mutation) {
                        return mutation.target.matches(mutationSelector);
                    });

                    if (!matches.length) {
                        clockifyButton.renderTo(selector, renderer);
                        return;
                    }
                });
                observer.observe(document, {childList: true, subtree: true});
            }
            clockifyButton.renderTo(selector, renderer);
        });
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
        let active = title && title === clockifyButton.inProgressDescription;

        setButtonProperties(button, title, active);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        button.onclick = () => {
            const timeEntryOptionsInvoked = objInvokeIfFunction(options);
            const title = timeEntryOptionsInvoked.description;
            if (title && title === clockifyButton.inProgressDescription) {
                aBrowser.runtime.sendMessage({eventName: 'endInProgress'}, (response) => {
                    if (response.status === 400) {
                        alert("Can't end entry without project/task/description or tags. Please edit your time entry.");
                    } else {
                        clockifyButton.inProgressDescription = null;
                        active = false;
                        setButtonProperties(button, title, active);
                        aBrowser.storage.sync.set({
                            timeEntryInProgress: null
                        });
                    }
                });
            } else {
                aBrowser.runtime.sendMessage({
                    eventName: 'startWithDescription',
                    timeEntryOptions: timeEntryOptionsInvoked
                }, (response) => {
                    if (response.status === 400) {
                        alert("Can't start entry without project/task/description or tags. Please edit your time entry. Please create your time entry using the dashboard or edit your workspace settings.");
                    } else {
                        active = true;
                        setButtonProperties(button, title, active);
                        clockifyButton.inProgressDescription = title;
                        aBrowser.storage.sync.set({
                            timeEntryInProgress: response.data
                        });
                    }
                });
            }

        };
        clockifyButton.links.push(button);
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
        input.setAttribute("placeholder", "Add time (1h 5m)");

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
                            console.error(response);
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
    button.title = title;
    if (active) {
        button.classList.remove('clockify-button-inactive');
        button.classList.add('clockify-button-active');
        if (!button.classList.contains('small')) {
            button.textContent = 'Stop timer';
            button.setAttribute('id', 'clockifyButton');
        } else {
            button.setAttribute('id', 'clockifySmallButton');
        }
    } else {
        button.classList.remove('clockify-button-active');
        button.classList.add('clockify-button-inactive');
        if (!button.classList.contains('small')) {
            button.textContent = 'Start timer';
            button.setAttribute('id', 'clockifyButton');
        } else {
            button.setAttribute('id', 'clockifySmallButton');
        }
    }
}

function updateButtonState(entry) {
    let button;
    if (clockifyButton.links.length < 1) {
        return;
    }
    clockifyButton.inProgressDescription = entry && entry.id ? entry.description : "";
    for (let i = 0; i < clockifyButton.links.length; i++) {
        button = clockifyButton.links[i];
        const active = entry && button.title === entry.description;

        this.setButtonProperties(button, button.title, active);
    }
}

aBrowser.storage.onChanged.addListener((changes, area) => {
    const changedItems = Object.keys(changes);

    if (changedItems.filter(item => item === 'timeEntryInProgress').length > 0) {
        aBrowser.storage.sync.get(['timeEntryInProgress'], (result) => {
            this.updateButtonState(result.timeEntryInProgress);
        });
    }
});



