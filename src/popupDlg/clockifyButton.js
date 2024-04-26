var aBrowser = chrome || browser;
var _clockifyPopupDlg;
var _waitingForResponse = false;
var _selectors = null;
var _clockifyShowPostStartPopup = true;
var documents = window.getAllDocuments();

removeAllButtons();
setPostStartPopup();

_clockifyShowPostStartPopup = true;
aBrowser.storage.local.get(['permanent_showPostStartPopup']).then((res) => {
	if (res.permanent_showPostStartPopup)
		_clockifyShowPostStartPopup = JSON.parse(res.permanent_showPostStartPopup);
	else {
		aBrowser.storage.local.set({ permanent_showPostStartPopup: 'true' });
	}
});

var clockifyButton = {
	inProgressDescription: '',
	nextIndex: 0,
	mutationObserver: {
		observer: null,
		allSelectors: [],
		callback: (mutations) => {
			for (const item of clockifyButton.mutationObserver.allSelectors) {
				const { selector, renderer, mutationSelector } = item;
				if (mutationSelector) {
					const matches = mutations.filter((mutation) =>
						mutation.target.matches(mutationSelector)
					);
					if (!matches.length) {
						continue;
					}
				}
				clockifyButton.renderTo(selector, renderer);
			}
		},

		start: (selector, opts, renderer, mutationSelector) => {
			const { mutationObserver } = clockifyButton;
			if (opts.observe) {
				if (!mutationObserver.observer) {
					if (opts.noDebounce) {
						mutationObserver.observer = new MutationObserver(
							mutationObserver.callback
						);
					} else {
						mutationObserver.observer = new MutationObserver(
							clockifyDebounce(mutationObserver.callback, 1000)
						);
					}

					documents.forEach((document) => {
						mutationObserver.observer.observe(document, {
							childList: true,
							subtree: true,
						});
					});
				}
				mutationObserver.allSelectors.push({
					selector,
					renderer,
					mutationSelector,
				});
			}
		},
	},

	observeDescription: (selector) => {
		if (!selector) return;
		setInterval(() => {
			const descriptionToObserve = document.querySelector(selector);
			const startTimerButton = closestClockifyButton(descriptionToObserve);

			if (!descriptionToObserve || !startTimerButton) return;

			startTimerButton.setAttribute('title', descriptionToObserve.textContent);
		}, 500);
	},

	render: (selector, opts, renderer, mutationSelector, descriptionSelector) => {
		clockifyButton.mutationObserver.start(
			selector,
			opts,
			renderer,
			mutationSelector
		);
		clockifyButton.observeDescription(descriptionSelector);
		clockifyButton.renderTo(selector, renderer);
	},

	renderTo: (selector, renderer) => {
		const elements = $$$(selector);

		elements.forEach((element, index) => {
			element.classList.add('clockify', 'clockify' + index);
			renderer(element, element.ownerDocument);
		});
	},

	createButton: (description, project, task) => {
		const currIndex = clockifyButton.nextIndex++;

		window.updateButtonProperties(
			{ newRoot: true, buttonId: currIndex },
			{ isPopupOpen: false }
		);

		const options = objectFromParams(description, project, task);
		clockifyButton.options = options;
		const button = document.createElement('div');
		if (invokeIfFunction(options.small)) {
			button.classList.add('small');
		}

		let title = invokeIfFunction(options.description);

		aBrowser.storage.local.get(
			['timeEntryInProgress', 'permanent_appendWebsiteURL', 'userId'],
			(result) => {
				let pipeSeparator = ' | ';
				if (result.permanent_appendWebsiteURL) {
					if (title.includes(' | ')) {
						pipeSeparator = ' || ';
					}
					const sufix = `${document.title} - ${window.location.href}`;
					if (!title.includes(sufix)) {
						title += `${pipeSeparator}${sufix}`;
					}
				}

				if (result.userId) {
					clockifyButton.userId = result.userId;
				}
				const entry = result.timeEntryInProgress;
				if (entry && entry.id) {
					if (!!entry.description) {
						clockifyButton.inProgressDescription = entry.description;
					} else {
						clockifyButton.inProgressDescription = '';
					}
				} else {
					clockifyButton.inProgressDescription = null;
				}
				const active =
					title &&
					removeAppendedURL(title, pipeSeparator) ===
						removeAppendedURL(
							clockifyButton.inProgressDescription,
							pipeSeparator
						);
				setButtonProperties(button, title, active, currIndex);

				this.setClockifyButtonLinks(button);
				window.updateButtonProperties(
					{
						options,
						title,
						active,
						small: !!options.small,
						buttonId: currIndex,
					},
					{
						inProgressDescription: clockifyButton.inProgressDescription,
					}
				);
			}
		);

		button.addEventListener('click', (e) => {
			function clickHandler() {
				aBrowser.runtime.sendMessage({
					eventName: 'sendAnalyticsEvent',
					options: {
						name: 'integration_click',
						activeIntegration:
							clockifyButton.injectedArguments?.activeIntegration,
						userId: clockifyButton.userId,
					},
				});
			}

			if (clockifyButton.userId) {
				clickHandler();
			} else {
				aBrowser.storage.local.get(['userId'], (result) => {
					if (result.userId) {
						clockifyButton.userId = result.userId;
						clickHandler();
					}
				});
			}
		});
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
		form.setAttribute('id', 'clockify-manual-input-form');
		form.appendChild(input);
		input.classList.add('clockify-input', 'clockify-input-default');
		input.setAttribute('placeholder', clockifyLocales.ADD_TIME_MANUAL);
		let cfFieldsRequired = false;

		input.addEventListener(
			'focus',
			() => {
				window.updateButtonProperties(null, {
					timeEntry: { originalInput: input.value },
					isPopupOpen: false,
					manualMode: true,
					inputElement: input,
				});
			},
			{ once: true }
		);

		aBrowser.storage.local.get(['workspaceSettings'], (result) => {
			result = JSON.parse(result.workspaceSettings);
			if (result.timeTrackingMode === 'STOPWATCH_ONLY') {
				form.style.display = 'none';
				const manualInputBackgroundTrello = $('.input-button-link');
				if (manualInputBackgroundTrello)
					manualInputBackgroundTrello.style.display = 'none';
			} else {
				form.style.display = 'inline-block';
				const manualInputBackgroundTrello = $('.input-button-link');
				if (manualInputBackgroundTrello)
					manualInputBackgroundTrello.style.display = 'inline-block';
			}
		});
		aBrowser.storage.local.get(['wsCustomFields'], (result) => {
			if (!result.wsCustomFields) return;
			const cfFields = JSON.parse(result.wsCustomFields);
			cfFields.forEach((field) => {
				if (field.required) {
					cfFieldsRequired = true;
				}
			});
		});

		form.onsubmit = async (e) => {
			e.preventDefault();
			e.stopPropagation();
			console.log('SUBMITTED')


			const response = await 	aBrowser.runtime.sendMessage({
				eventName: 'getEntryInProgress',
			})
			if (response === 'Forbidden') {
				alert(clockifyLocales.WORKSPACE_LOCKED)
				return;
			}

			let workspaceSettings = await localStorage.getItem('workspaceSettings');
			workspaceSettings = JSON.parse(workspaceSettings);
			if (
				workspaceSettings.features &&
				workspaceSettings.features.featureSubscriptionType !== 'SELF_HOSTED' &&
				!workspaceSettings.features.timeTracking
			) {
				const isUserOwnerOrAdmin = await localStorage.getItem(
					'isUserOwnerOrAdmin'
				);
				const wasRegionalEverAllowed = await localStorage.getItem(
					'wasRegionalEverAllowed'
				);
				alert(
					!wasRegionalEverAllowed
						? isUserOwnerOrAdmin
							? clockifyLocales.UPGRADE_REGIONAL_ADMIN
							: clockifyLocales.UPGRADE_REGIONAL
						: isUserOwnerOrAdmin
						? clockifyLocales.SUBSCRIPTION_EXPIRED
						: clockifyLocales.FEATURE_DISABLED_CONTACT_ADMIN
				);
				return;
			}

			//remove form if force timer enabled
			// format options so that if a function is passed we get its return value
			// as part of the options objects key value pairs
			const timeEntryOptionsInvoked = objInvokeIfFunction(options);

			const appendWebsiteURL = await localStorage.getItem(
				'permanent_appendWebsiteURL'
			);
			let title = timeEntryOptionsInvoked.description;
			if (appendWebsiteURL) {
				const pipeSeparator = title.includes(' | ') ? ' || ' : ' | ';
				const sufix = `${document.title} - ${window.location.href}`;
				if (!title.includes(sufix)) {
					title += `${pipeSeparator}${sufix}`;
				}
				timeEntryOptionsInvoked.description = title;
			}
			try {
				const time = input.value;
				const m = time.match(/(?=.{2,})^(\d+d)?\s*(\d+h)?\s*(\d+m)?$/);
				if (m) {
					input.value = clockifyLocales.SUBMITTING;
					const totalMins =
						8 * 60 * parseInt(m[1] || 0, 10) +
						60 * parseInt(m[2] || 0, 10) +
						parseInt(m[3] || 0, 10);
					aBrowser.storage.local.get(['wsSettings'], async (result) => {
						const { wsSettings } = result;
						if (
							(wsSettings.forceDescription &&
								!timeEntryOptionsInvoked.description) ||
							wsSettings.forceProjects ||
							wsSettings.forceTasks ||
							wsSettings.forceTags ||
							cfFieldsRequired ||
							_clockifyShowPostStartPopup
						) {
							if (timeEntryOptionsInvoked.projectName) {
								const response = await aBrowser.runtime.sendMessage({
									eventName: 'generateManualEntryData',
									options: timeEntryOptionsInvoked,
								});

								const timeEntry = {
									...timeEntryOptionsInvoked,
									totalMins,
									originalInput: time,
									projectId:
										!response.task?.id && wsSettings.forceTasks
											? null
											: response.project?.id,
									taskId: response.task?.id,
									billable: response.project?.billable,
									tags: response.tags,
									tagIds: response.tags?.map((tag) => tag.id) ?? [],
									project: response.project,
									task: response.task,
								};
								window.updateButtonProperties(null, {
									timeEntry,
									manualMode: true,
									isPopupOpen: true,
									inputElement: input,
								});
								input.value = '';
							} else {
								const response = await aBrowser.runtime.sendMessage({
									eventName: 'getDefaultProjectTask',
								});
								const timeEntry = {
									...timeEntryOptionsInvoked,
									totalMins,
									originalInput: time,
									projectId: response.projectDB?.id,
									taskId: response.taskDB?.id,
									billable: response.projectDB?.billable,
									project: response.projectDB,
									task: response.taskDB,
								};
								window.updateButtonProperties(null, {
									timeEntry,
									manualMode: true,
									isPopupOpen: true,
									inputElement: input,
								});
								input.value = '';
							}
						} else {
							inputMessage(input, clockifyLocales.SUBMITTING);
							aBrowser.runtime.sendMessage(
								{
									eventName: 'submitTime',
									options: {
										totalMins,
										timeEntryOptions: timeEntryOptionsInvoked,
									},
								},
								(response) => {
									input.value = '';
									if (!response) {
										inputMessage(input, 'Error: ' + (response ?? ''), 'error');
									} else if (typeof response === 'string') {
										alert(response);
									} else if (response.status !== 201) {
										if (response.status === 400) {
											// project/task/etc. can be configured to be mandatory; this can result in a code 400 during
											// time entry creation
											if (response.endInProgressStatus) {
												inputMessage(
													input,
													'Error: ' + response.status,
													'error'
												);
												alert(
													`${clockifyLocales.YOU_ALREADY_HAVE_ENTRY_WITHOUT}.\n${clockifyLocales.PLEASE_EDIT_YOUR_TIME_ENTRY}.`
												);
											} else {
												alert(
													clockifyLocales.CANNOT_START_ENTRY_WITHOUT_PROJECT
												);
											}
										}
									} else {
										inputMessage(input, clockifyLocales.TIME_ADDED, 'success');
									}
								}
							);
						}
					});
				} else {
					inputMessage(input, 'Format: 1d 2h 30m', 'error', true);
				}
			} catch (e) {
				console.error(e);
			}
			// don't reload the page
			return false;
		};
		return form;
	},

	observeDarkMode: (isThemeDark) => {
		function observeThemeChange() {
			const themeObserver = new MutationObserver(updateColorStyle);

			themeObserver.observe(document.body, { attributes: true });
		}

		function updateColorStyle() {
			return isThemeDark() ? addDarkThemeStyle() : removeDarkThemeStyle();
		}

		function addDarkThemeStyle() {
			if ($('.clockify-custom-style-dark')) return;

			const darkThemeStyle = `
	  .clockify-input {
		background: #333 !important;
		border: #444 !important;
		color: #f4f4f4 !important;
	  }

	  .clockify-button-inactive {
		color: rgba(255, 255, 255, 0.81) !important;
	  }`;

			const style = createTag(
				'style',
				'clockify-custom-style-dark',
				darkThemeStyle
			);

			document.head.append(style);
		}

		function removeDarkThemeStyle() {
			$('.clockify-custom-style-dark')?.remove();
		}

		observeThemeChange();
		updateColorStyle();
	},
};

function objectFromParams(first, second, third) {
	const isFirstArgumentObject = typeof first === 'object';
	const buttonOptions = {
		description: first || '',
		projectName: second || null,
		taskName: third || null,
		billable: null,
	};

	return isFirstArgumentObject ? first : buttonOptions;
}

function $(selector, context = document) {
	return context.querySelector(selector);
}

function $$(selector, context = document) {
	return context.querySelectorAll(selector);
}

function $$$(selector, contexts = documents) {
	return contexts
		.map((context) => context.querySelectorAll(selector))
		.map((nodeList) => Array.from(nodeList))
		.flat();
}

function text(selector, context = document) {
	return $(selector, context)?.textContent?.trim();
}

function value(selector, context = document) {
	return $(selector, context)?.value?.trim();
}

function textList(selector, context = document, withoutDuplicates = true) {
	const elements = Array.from($$(selector, context) || []);

	const texts = elements
		.map((element) => element.textContent)
		.filter((value) => Boolean(value))
		.map((text) => text.trim());

	return withoutDuplicates ? [...new Set(texts)] : texts;
}

function timeout({ milliseconds }) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function waitForElement(selector, context = document) {
	return new Promise((resolve) => {
		if ($(selector, context)) return resolve($(selector, context));

		const observer = new MutationObserver(observeBodyChanges);

		const observationTarget = document.body;
		const observationConfig = { childList: true, subtree: true };

		observer.observe(observationTarget, observationConfig);

		function observeBodyChanges() {
			const element = $(selector, context);

			if (element) {
				observer.disconnect();
				resolve(element);
			}
		}
	});
}

function applyStyles(css, classNames = 'clockify-custom-styles') {
	removeStyles(classNames);

	const style = createTag('style', classNames, css);

	document.head.append(style);
}

function removeStyles(classNames = 'clockify-custom-styles') {
	const selector = classNames
		.split(' ')
		.map((className) => `.${className}`)
		.join('');

	$(selector)?.remove();
}

async function getSelectors(integrationName, viewName, selectorsName) {
	if (!_selectors) {
		const response = await aBrowser.storage.local.get(['integrationSelectors']);

		const { integrationSelectors } = response;

		_selectors = integrationSelectors;
	}

	return selectorsName
		? _selectors[integrationName][viewName][selectorsName]
		: viewName
		? _selectors[integrationName][viewName]
		: integrationName
		? _selectors[integrationName]
		: _selectors;
}

function invokeIfFunction(trial) {
	return trial instanceof Function ? invokeIfFunction(trial()) : trial;
}

function objInvokeIfFunction(obj) {
	const result = {};
	for (const key of Object.keys(obj)) {
		result[key] = invokeIfFunction(obj[key]);
	}
	return result;
}

function createTag(name, className = '', textContent = '') {
	const tag = document.createElement(name);

	tag.className = className;
	tag.textContent = textContent;

	return tag;
}

function removeAppendedURL(text, separator) {
	return text?.split(separator)[0];
}

function closestClockifyButton(
	rootElement,
	clockifyButtonSelector = '.clockifyButton'
) {
	let element = rootElement;
	while (element) {
		const clockifyButton = element.querySelector(clockifyButtonSelector);
		if (clockifyButton) {
			return clockifyButton;
		}

		element = element.parentElement;
	}
	return null;
}

function inputMessage(input, msg, type, clearInput = false) {
	input.readOnly = true;
	const oldValue = input.value;
	const inputClasses = [
		'clockify-input-default',
		'clockify-input-error',
		'clockify-input-success',
	];
	input.classList.remove(...inputClasses);
	input.classList.add('clockify-input-' + type);
	input.value = msg;

	setTimeout(() => {
		input.value = clearInput ? '' : oldValue;
		input.classList.remove(...inputClasses);
		input.classList.add('clockify-input-default');
		input.readOnly = false;
	}, 1500);
}

function setButtonProperties(button, title, active, buttonId = 0) {
	button.title = title;
	button.classList.add('clockifyButton', 'clockifyButtonId' + buttonId);

	if (active) {
		if (!button.classList.contains('small')) {
			button.setAttribute('id', 'clockifyButton');
		} else {
			button.setAttribute('id', 'clockifySmallButton');
		}
	} else {
		if (!button.classList.contains('small')) {
			button.setAttribute('id', 'clockifyButton');
		} else {
			button.setAttribute('id', 'clockifySmallButton');
		}
	}

	window.updateButtonProperties(
		{
			title,
			active,
			small: button.classList.contains('small'),
			buttonId,
		},
		{
			inProgressDescription: clockifyButton.inProgressDescription,
		}
	);
}

function updateButtonOnProgressChanged(timeEntry) {
	const { newValue: timeEntryInProgress, oldValue: oldTimeEntryValue } =
		timeEntry;

	clockifyButton.inProgressDescription =
		timeEntryInProgress && timeEntryInProgress.id
			? timeEntryInProgress.description
			: '';

	const allButtons = $$$('.clockifyButton');

	allButtons.forEach((button) => {
		const buttonId = button.className.match(/clockifyButtonId(\d+)/)[1];
		const title = button.title || button.dataset.title; // fix for Zoho Desk bug with disappearing title atributte
		let pipeSeparator = ' | ';
		if (title?.includes(' | ')) pipeSeparator = ' || ';
		const titleWoURL = removeAppendedURL(title, pipeSeparator);
		const currentEntryDescriptionWoURL = removeAppendedURL(
			timeEntryInProgress?.description,
			pipeSeparator
		);
		const previousEntryDescriptionWoURL = removeAppendedURL(
			oldTimeEntryValue?.description,
			pipeSeparator
		);

		const active =
			timeEntryInProgress && titleWoURL === currentEntryDescriptionWoURL;

		const titleMatchesCurrentOrPreviousEntryDescription =
			titleWoURL === currentEntryDescriptionWoURL ||
			titleWoURL === previousEntryDescriptionWoURL;

		if (titleMatchesCurrentOrPreviousEntryDescription) {
			console.count('updateButtonState');
			this.setButtonProperties(
				button,
				clockifyButton.inProgressDescription || title,
				active,
				buttonId
			);
		}

		if (button.onEntryChanged) button.onEntryChanged(timeEntryInProgress);
	});
}

async function hideClockifyButtonLinks() {
	const css = `
			#clockifyButton, #clockify-manual-input-form { 
				display: none !important; 
			}
		`;
	const style = document.createElement('style');

	style.innerText = css;
	document.head.appendChild(style);
}

function setClockifyButtonLinks(button) {
	document.clockifyButtonLinks = document.clockifyButtonLinks || [];
	document.clockifyButtonLinks.push(button);
}

if (!window.clockifyListeners) {
	window.clockifyListeners = {
		clockifyClicks: function (e) {
			const divPopupDlg = document.getElementById('divClockifyPopupDlg');
			if (!divPopupDlg) return;

			if (divPopupDlg.contains(e.target)) {
				_clockifyPopupDlg.onClicked(e.target);
				e.stopPropagation();
				if (
					e.target &&
					(e.target.tagName === 'A' ||
						e.target.id.startsWith('switchbox') ||
						e.target.id.startsWith('txtCustomField'))
				) {
				} else {
					e.preventDefault();
				}
			} else {
				const div = document.getElementById('divClockifyProjectDropDownPopup');
				if (div && div.contains(e.target)) {
					_clockifyPopupDlg.onClickedProjectDropDown(e.target);
					e.stopPropagation();
					e.preventDefault();
				} else {
					const div = document.getElementById('divClockifyTagDropDownPopup');
					if (div && div.contains(e.target)) {
						_clockifyPopupDlg.onClickedTagDropDown(e.target);
						e.stopPropagation();
						e.preventDefault();
					} else {
						const div = document.getElementById('divClockifyLinkModal');
						if (div && div.style.display !== 'none') {
							_clockifyPopupDlg.onClickedLinkModal(div, e.target);
							e.stopPropagation();
							e.preventDefault();
						} else {
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
		clockifyChanges: (e) => {
			const divPopupDlg = document.getElementById('divClockifyPopupDlg');
			if (e.target && e.target.id === 'txtCustomFieldLinkModal') {
				$('.clockify-save').classList.remove('clockify-save--disabled');
				e.stopPropagation();
				e.preventDefault();
			} else if (divPopupDlg && divPopupDlg.contains(e.target)) {
				_clockifyPopupDlg.onChanged(e.target);
				e.stopPropagation();
				e.preventDefault();
			}
		},
		clockifyRemovePopupDlg: (e) => {
			const divPopupDlg = document.getElementById('divClockifyPopupDlg');
			if (divPopupDlg && !divPopupDlg.contains(e.target)) {
				const divProjectDropDownPopup = document.getElementById(
					'divClockifyProjectDropDownPopup'
				);
				const divTagDropDownPopup = document.getElementById(
					'divClockifyTagDropDownPopup'
				);
				if (
					(divProjectDropDownPopup &&
						divProjectDropDownPopup.contains(e.target)) ||
					(divTagDropDownPopup && divTagDropDownPopup.contains(e.target))
				)
					return;
				clockifyDestroyPopupDlg();
			}
		},
		clockifyTrackResize: () => {
			if (_clockifyPopupDlg) clockifyRepositionDropDown();
		},
		clockifyTrackScroll: () => {
			if (_clockifyPopupDlg) clockifyRepositionDropDown();
		},
	};
}

function removeAllButtons(wrapperClass) {
	// Fix for bug with deleting and appending Clockify elements on every click (Google Docs integration)
	if (location.hostname.startsWith('docs.google.')) return;

	const buttons = $$$(
		wrapperClass || '.clockifyButton, #clockify-manual-input-form'
	);
	const divs = $$$('.clockify');

	buttons.forEach((button) => button.parentNode.removeChild(button));
	divs.forEach((div) => div.classList.remove('clockify'));
}

async function setPostStartPopup() {
	const { permanent_showPostStartPopup: showPostStartPopup } =
		await aBrowser.storage.local.get(['permanent_showPostStartPopup']);

	if (showPostStartPopup)
		_clockifyShowPostStartPopup = JSON.parse(showPostStartPopup);
	else aBrowser.storage.local.set({ permanent_showPostStartPopup: 'true' });
}

function clockifyDestroyPopupDlg() {
	const divPopupDlg = document.getElementById('divClockifyPopupDlg');
	if (divPopupDlg) {
		if (window.clockifyListeners) {
			window.removeEventListener(
				'click',
				window.clockifyListeners.clockifyClicks,
				true
			);
			window.removeEventListener(
				'change',
				window.clockifyListeners.clockifyChanges,
				true
			);
			window.removeEventListener(
				'resize',
				window.clockifyListeners.clockifyTrackResize,
				true
			);
			window.removeEventListener(
				'scroll',
				window.clockifyListeners.clockifyTrackScroll,
				true
			);
			_clockifyPopupDlg.destroy();
			document.body.removeChild(divPopupDlg);
			document.removeEventListener(
				'click',
				window.clockifyListeners.clockifyRemovePopupDlg,
				true
			);

			_clockifyPopupDlg = null;
		}
	}
}

function clockifyRepositionDropDown() {
	const divPopup = document.getElementById('divClockifyProjectDropDownPopup');
	if (divPopup) {
		_clockifyProjectList.repositionDropDown();
	} else {
		const divPopup = document.getElementById('divClockifyTagDropDownPopup');
		if (divPopup) {
			_clockifyTagList.repositionDropDown();
		} else {
			// custom fields popups
			_clockifyPopupDlg.repositionDropDownCF();
		}
	}
}

function onChangedListener(changes) {
	const changedItems = Object.keys(changes);
	const timeEntryInProgressChanged = changedItems.find((item) => {
		return item === 'timeEntryInProgress';
	});
	if (timeEntryInProgressChanged) {
		const timeEntry = changes['timeEntryInProgress'];
		this.updateButtonOnProgressChanged(timeEntry);
	}

	if (changedItems.find((item) => item === 'token')) {
		aBrowser.storage.local.get(['token'], (result) => {
			if (!result.token) {
				this.hideClockifyButtonLinks();
			}
		});
	}

	if (changedItems.find((item) => item === 'permanent_showPostStartPopup')) {
		aBrowser.storage.local.get(['permanent_showPostStartPopup'], (result) => {
			_clockifyShowPostStartPopup =
				result.permanent_showPostStartPopup === 'true' ? true : false;
		});
	}

	if (changedItems.find((item) => item === 'wsSettings')) {
		if (_clockifyShowPostStartPopup) {
			aBrowser.storage.local.get(['wsSettings'], (result) => {
				// ClockifyEditForm.prototype.wsSettings = result.wsSettings;
			});
		}
	}

	if (changedItems.find((item) => item === 'workspaceSettings')) {
		aBrowser.storage.local.get(['workspaceSettings'], (result) => {
			if (result.workspaceSettings) {
				const settings = JSON.parse(result.workspaceSettings);
				if (settings.timeTrackingMode === 'STOPWATCH_ONLY') {
					const manualInputForm = $('#clockify-manual-input-form');
					const manualInputBackgroundTrello = $('.input-button-link');
					if (manualInputForm) manualInputForm.style.display = 'none';
					if (manualInputBackgroundTrello)
						manualInputBackgroundTrello.style.display = 'none';
				} else {
					const manualInputForm = $('#clockify-manual-input-form');
					if (manualInputForm) manualInputForm.style.display = 'inline-block';
					const manualInputBackgroundTrello = $('.input-button-link');
					if (manualInputBackgroundTrello)
						manualInputBackgroundTrello.style.display = 'inline-block';
				}
			}
		});
	}

	if (changedItems.find((item) => item === 'integrationAlert')) {
		aBrowser.storage.local.get(['integrationAlert'], (result) => {
			if (result.integrationAlert) {
				alert(result.integrationAlert);
				aBrowser.storage.local.set({ integrationAlert: '' });
			}
		});
	}
}

aBrowser.storage.onChanged.addListener(onChangedListener);

function cleanup() {
	aBrowser.storage.onChanged.removeListener(onChangedListener);
	aBrowser.runtime.onMessage.removeListener(onMessageListener);
}

function onMessageListener(request) {
	if (request.eventName === 'cleanup') {
		cleanup();
	}

	if (request.eventName === 'passArgumentsToClockifyButton') {
		console.log('PASS options', request.options);
		clockifyButton = { ...clockifyButton, injectedArguments: request.options };
		console.log('PASS ARGS', clockifyButton);
	}
}

aBrowser.runtime.onMessage.addListener(onMessageListener);
