let customBrowser;

export function getBrowser() {
	if (typeof chrome !== 'undefined') {
		if (typeof browser !== 'undefined') {
			return Object.assign(browser, {
				action: browser.browserAction,
				scripting: {
					executeScript: ({ target, files }, cb) => {
						browser.tabs.executeScript(target.tabId, { file: files[0] }, cb);
					},
					insertCSS: ({ target, files }) => {
						browser.tabs.insertCSS(target.tabId, { file: files[0] });
					},
				},
			});
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
			callbacks: [],
		},
	};

	browser.runtime.onMessage = {
		addListener: (callback) => {
			browser.runtime.callbacks.push(callback);

			return callback;
		},

		removeListener: (listener) => {
			browser.runtime.callbacks = browser.runtime.callbacks.filter(
				(cb) => cb !== listener
			);
		},
	};

	browser.runtime.sendMessage = (message) =>
		browser.runtime.callbacks.forEach((callback) => callback(message));

	customBrowser = browser;

	return customBrowser;
}

export function isChrome() {
	if (typeof chrome !== 'undefined') {
		if (typeof browser !== 'undefined') {
			return false;
		} else {
			return true;
		}
	}
}
