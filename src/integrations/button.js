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
        let timeEntryOptions;
        if (typeof description === 'object') {
            // mode: only one parameter that contains the options
            timeEntryOptions = description;
        } else {
            // legacy mode: multiple parameters
            timeEntryOptions = {
                description: description || "",
                projectName: project || null,
                taskName: task || null,
                billable: null
            };
        }

        const button = document.createElement('a');
        let title = invokeIfFunction(timeEntryOptions.description);
        let active = title && title === clockifyButton.inProgressDescription;

        setButtonProperties(button, title, active);

        button.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        button.onclick = () => {
            title = invokeIfFunction(timeEntryOptions.description);
            if (title && title === clockifyButton.inProgressDescription) {
                aBrowser.runtime.sendMessage({eventName: 'endInProgress'}, (response) => {
                    if (response.status === 400) {
                        alert("Can't end entry without project/task/description or tags.Please edit your time entry.");
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
                    timeEntryOptions: timeEntryOptions
                }, (response) => {
                    if (response.status === 400) {
                        alert("Can't end entry without project/task/description or tags.Please edit your time entry.");
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
        const button = document.createElement('a');
        let title = invokeIfFunction(description);
        let active = clockifyButton.inProgressDescription === title;
        const projectName = !!project ? project : null;
        button.classList.add('small');
        setButtonProperties(button, title, active);

        button.onclick = () => {
            if (clockifyButton.inProgressDescription === title) {
                aBrowser.runtime.sendMessage({eventName: 'endInProgress'}, (response) => {
                    if (response.status === 400) {
                        alert("Can't end entry without project/task/description or tags.Please edit your time entry.");
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
                    description: title,
                    project: projectName
                }, (response) => {
                    if (response.status === 400) {
                        alert("Can't end entry without project/task/description or tags.Please edit your time entry.");
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
    }
};

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

function createTag(name, className, textContent) {
    const tag = document.createElement(name);
    tag.className = className;

    if (textContent) {
        tag.textContent = textContent;
    }

    return tag;
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



