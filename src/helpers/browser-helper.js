let customBrowser;

export function getBrowser() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return browser;
        } else {
            return chrome;
        }
    } else {
        return createBrowser();
    }
}

function createBrowser() {
    if (customBrowser) return customBrowser;

    let browser = {
        runtime: {
            callbacks: []
        }
    };

    browser.runtime.onMessage = {
        addListener: (callback) => {
            browser.runtime.callbacks.push(callback);

            return callback;
        },

        removeListener: (listener) => {
            browser.runtime.callbacks = browser.runtime.callbacks.filter(cb => cb !== listener);
        }
    };

    browser.runtime.sendMessage = (message) => browser.runtime.callbacks.forEach(callback => callback(message));

    customBrowser = browser;

    return customBrowser;
}

export function isChrome() {
    if (typeof chrome !== "undefined") {
        if (typeof browser !== "undefined") {
            return false;
        } else {
            return true;
        }
    }
}
