export default (function () {
	const _supportedLanguages = ['en', 'fr', 'es', 'pt', 'ru', 'de', 'ko', 'ja'];

	self.aBrowser = chrome || browser;

	self.aBrowser.storage.local.get(
		'workspaceSettings',
		({ workspaceSettings }) => {
			if (workspaceSettings) {
				self.wsSettings = JSON.parse(workspaceSettings);
			}
		}
	);

	self.aBrowser.storage.onChanged.addListener((changes) => {
		if (changes.workspaceSettings && changes.workspaceSettings.newValue) {
			self.wsSettings = JSON.parse(changes.workspaceSettings.newValue);
		}
	});

	function detectBrowserLanguage() {
		const language = self.aBrowser.i18n.getUILanguage();

		let lang = language;
		if (!lang) lang = 'en';
		if (lang.indexOf('-') !== -1) lang = lang.split('-')[0];
		if (lang.indexOf('_') !== -1) lang = lang.split('_')[0];
		return _supportedLanguages.includes(lang) ? lang : 'en';
	}

	function debounce(func, delay) {
		let timer;
		let executeImmediately = true;
		return function () {
			const context = this;
			const args = arguments;
			clearTimeout(timer);
			if (executeImmediately) {
				func.apply(context, args);
				executeImmediately = false;
			}
			timer = setTimeout(() => {
				executeImmediately = true;
			}, delay);
		};
	}

	const objLocales = {
		browserLanguage: detectBrowserLanguage(),
		lang: 'en',
		messages: null,
		async loadLocaleMessagesFromJson(lang = 'en') {
			const res = await fetch(
				self.aBrowser.runtime.getURL(`/_locales/${lang}/messages.json`)
			);
			const messages = await res.json();
			this.lang = lang;
			this.messages = messages;
			self.aBrowser.storage.local.set({ locale_messages: messages }, () => {
				self.aBrowser.runtime.sendMessage({
					eventName: 'updateContexMenu',
				});
			});
			return res;
		},

		onProfileLangChange(lang) {
			if (!lang) {
				lang = this.browserLanguage;
			}
			if (!_supportedLanguages.includes(lang)) {
				lang = 'en';
			}
			self.aBrowser.storage.local.set({ lang: lang });
			return this.loadLocaleMessagesFromJson(lang);
		},

		getMsg(key) {
			let messageObject = this.messages[key];
			return messageObject ? messageObject.message : key;
		},

		getMessage(id, params) {
			const getFromMessages = () => {
				if (!params) {
					return this.getMsg(id);
				}
				let messageObject = this.messages[id];
				if (!messageObject || !messageObject.message) return messageObject;
				let message = messageObject.message;

				for (let i = 0; i < params.length; i++) {
					message = message.replace(/\{ .+?}/, params[i]);
				}
				return message;
			};

			if (!this.messages) {
				this.loadLocaleMessagesFromJson(this.lang).then(() => {
					return getFromMessages();
				});
			} else {
				return getFromMessages();
			}
		},

		replaceLabels(localeStr) {
			if (
				!self.wsSettings ||
				!self.wsSettings.projectLabel ||
				!self.wsSettings.taskLabel ||
				!self.wsSettings.projectGroupingLabel
			) {
				return localeStr;
			}
			const { projectLabel, taskLabel, projectGroupingLabel } = self.wsSettings;
			const regex = new RegExp(
				`(${this.getMessage('PROJECTS')}|${this.getMessage(
					'PROJECT'
				)}|${this.getMessage('TASKS')}|${this.getMessage(
					'TASK'
				)}|${this.getMessage('CLIENTS')}|${this.getMessage('CLIENT')})`,
				'gi'
			);
			const pluralRegex = new RegExp(
				`(${this.getMessage('PROJECTS')}|${this.getMessage(
					'TASKS'
				)}|${this.getMessage('CLIENTS')})`,
				'i'
			);
			return localeStr.replaceAll(regex, (match) => {
				const plural = pluralRegex.test(match);
				let label = projectLabel;
				if (
					match.toLowerCase() === this.getMessage('TASK').toLowerCase() ||
					match.toLowerCase() === this.getMessage('TASKS').toLowerCase()
				) {
					label = taskLabel;
				} else if (
					match.toLowerCase() === this.getMessage('CLIENT').toLowerCase() ||
					match.toLowerCase() === this.getMessage('CLIENTS').toLowerCase()
				) {
					label = projectGroupingLabel;
				}

				let caseType = 'uppercase';
				if (
					match[0] === match[0].toUpperCase() &&
					match[1] &&
					match[1] === match[1].toLowerCase()
				) {
					caseType = 'capital';
				} else if (match[0] === match[0].toLowerCase()) {
					caseType = 'lowercase';
				}
				return this.CUSTOM_LABEL(label, plural, caseType);
			});
		},

		CUSTOM_LABEL(label, plural = false, caseType = 'lowercase') {
			if (!label) return;
			let result = label;
			label = label.toUpperCase().replaceAll(' ', '_');
			const options = [
				'CLIENT',
				'DEPARTMENT',
				'CATEGORY',
				'PROJECT',
				'LOCATION',
				'JOB',
				'TASK',
				'ACTIVITY',
				'JOB_AREA',
			];

			if (options.includes(label)) {
				if (plural) {
					if (label[label.length - 1] === 'Y') {
						label = label.slice(0, label.length - 1) + 'IE';
					}
					label += 'S';
				}
				result = this.getMessage(label);
			}

			result =
				caseType === 'lowercase' || caseType === 'capital'
					? result.toLowerCase()
					: result.toUpperCase();

			if (caseType === 'capital') {
				result = result[0].toUpperCase() + result.slice(1);
			}

			return result;
		},
	};

	// if (self.clockifyLocales) {
	self.aBrowser.storage.local.get(
		['lang', 'locale_messages'],
		({ lang, locale_messages }) => {
			objLocales.lang = lang;
			objLocales.messages = locale_messages;
			self.aBrowser.runtime.sendMessage({
				eventName: 'updateContexMenu',
			});
		}
	);

	self.aBrowser.storage.onChanged.addListener((changes) => {
		if (changes.lang) {
			objLocales.lang = changes.lang.newValue;
		}
		if (changes.locale_messages) {
			objLocales.messages = changes.locale_messages.newValue;
			self.aBrowser.runtime.sendMessage({
				eventName: 'updateContexMenu',
			});
		}
	});
	// }

	const hasPlaceholders = new RegExp('{ .+ }');

	const locales = new Proxy(objLocales, {
		get(obj, prop) {
			const hasLabels = new RegExp(
				`(${objLocales.getMessage('PROJECTS')}|${objLocales.getMessage(
					'PROJECT'
				)}|${objLocales.getMessage('TASKS')}|${objLocales.getMessage(
					'TASK'
				)}|${objLocales.getMessage('CLIENTS')}|${objLocales.getMessage(
					'CLIENT'
				)})`,
				'gi'
			);

			let locale = null;
			if (prop in obj) {
				return function (...args) {
					return obj[prop](...args);
				};
			}

			locale = obj.getMessage(prop);

			if (hasPlaceholders.test(locale)) {
				return function (...args) {
					locale = obj.getMessage(prop, args);
					if (hasLabels.test(locale)) {
						locale = obj.replaceLabels(locale);
					}
					return locale;
				};
			}

			if (hasLabels.test(locale)) {
				locale = obj.replaceLabels(locale);
			}
			return locale;
		},
	});
	return locales;
})();
