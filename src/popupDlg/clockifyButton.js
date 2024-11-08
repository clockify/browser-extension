var aBrowser = chrome || browser;
var _clockifyPopupDlg;
var _waitingForResponse = false;
var _selectors = null;
var _clockifyShowPostStartPopup = true;
var _timeEntryInProgressDescription = null;
var documents = window.getAllDocuments();

removeAllButtons();
setPostStartPopup();
setManualElementsVisibility();

function triggerUrlChanged() {
	const event = new Event('urlChanged');
	window.dispatchEvent(event);
}

(function (history) {
	const pushState = history.pushState;
	const replaceState = history.replaceState;

	history.pushState = function (state) {
		pushState.apply(history, arguments);
		triggerUrlChanged();
	};

	history.replaceState = function (state) {
		replaceState.apply(history, arguments);
		triggerUrlChanged();
	};

	window.addEventListener('popstate', () => {
		triggerUrlChanged();
	});
})(window.history);

window.addEventListener('urlChanged', () => {
	if (clockifyButton.onNavigationRerender) {
		clockifyButton.nextIndex = 0;
		clockifyButton.rerenderAllButtons();
	}
});

aBrowser.storage.local.get(['timeEntryInProgress']).then(({ timeEntryInProgress }) => {
	_timeEntryInProgressDescription = timeEntryInProgress?.description;
});

var clockifyButton = {
	inProgressDescription: '',
	onNavigationRerender: false,
	nextIndex: 0,
	mutationObserver: {
		observer: null,
		allSelectors: [],
		callback: mutations => {
			for (const item of clockifyButton.mutationObserver.allSelectors) {
				const { selector, renderer, mutationSelector } = item;
				if (mutationSelector) {
					const matches = mutations.filter(mutation =>
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
						mutationObserver.observer = new MutationObserver(mutationObserver.callback);
					} else {
						mutationObserver.observer = new MutationObserver(
							clockifyDebounce(mutationObserver.callback, 1000)
						);
					}

					documents.forEach(document => {
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

	observeDescription: selector => {
		if (!selector) return;
		setInterval(() => {
			const descriptionToObserve = document.querySelector(selector);
			const startTimerButton = closestClockifyButton(descriptionToObserve);

			if (!descriptionToObserve || !startTimerButton) return;

			startTimerButton.setAttribute('title', descriptionToObserve.textContent);
		}, 500);
	},

	render: (selector, opts, renderer, mutationSelector, descriptionSelector) => {
		if (opts.onNavigationRerender) clockifyButton.onNavigationRerender = true;

		clockifyButton.mutationObserver.start(selector, opts, renderer, mutationSelector);
		clockifyButton.observeDescription(descriptionSelector);
		clockifyButton.renderTo(selector, renderer);
	},

	rerenderAllButtons: () => {
		const integrationElementSelectors = `.clockifyButton, #clockify-manual-input-form, .clockify-widget-container, .button-link:has(.clockifyButton)`;
		const integrationElements = Array.from($$$(integrationElementSelectors));

		integrationElements.forEach(e => e?.remove());
		$$$('.clockify').forEach(e => e.classList.remove('clockify'));
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
			{
				newRoot: true,
				buttonId: currIndex,
			},
			{
				isPopupOpen: false,
			}
		);

		const options = objectFromParams(description, project, task);
		clockifyButton.options = options;
		const isSmall = invokeIfFunction(options.small);

		let title = invokeIfFunction(options.description);
		const pipeSeparator = title?.includes(' | ') ? ' || ' : ' | ';

		const titleMatchesInProgressDescription =
			withoutAppendedUrl(title, pipeSeparator) ===
			withoutAppendedUrl(_timeEntryInProgressDescription, pipeSeparator);
		const isActive = title && titleMatchesInProgressDescription;

		const button = getClockifyButtonHTML({ options, isActive, isSmall });

		if (isSmall) button.classList.add('small');

		aBrowser.storage.local.get(
			['timeEntryInProgress', 'permanent_appendWebsiteURL', 'userId'],
			({ timeEntryInProgress, permanent_appendWebsiteURL, userId }) => {
				const entry = timeEntryInProgress;

				if (permanent_appendWebsiteURL) {
					title = withAppendedUrl(title);
				}
				if (userId) {
					clockifyButton.userId = userId;
				}

				if (entry && entry.id) {
					clockifyButton.inProgressDescription = entry.description || '';
				} else {
					clockifyButton.inProgressDescription = null;
				}
				setButtonProperties(button, title, isActive, currIndex);

				this.setClockifyButtonLinks(button);
				window.updateButtonProperties(
					{
						options,
						title,
						active: isActive,
						small: isSmall,
						buttonId: currIndex,
						integrationName: clockifyButton?.injectedArguments?.integrationName,
					},
					{
						inProgressDescription: clockifyButton.inProgressDescription,
					}
				);
			}
		);

		return button;
	},

	createTimer: (...args) => {
		return clockifyButton.createButton(...args);
	},

	createSmallButton: (description, project) => {
		const options = objectFromParams(description, project);
		options.small = true;

		return clockifyButton.createButton(options);
	},

	createInput: options => {
		const form = document.createElement('form');
		const input = document.createElement('input');
		form.setAttribute('id', 'clockify-manual-input-form');
		form.appendChild(input);
		input.classList.add('clockify-input', 'clockify-input-default');
		input.setAttribute('placeholder', clockifyLocales.ADD_TIME_MANUAL);
		const inputWrapper = input.parentElement;

		input.addEventListener(
			'focus',
			() => {
				window.updateButtonProperties(null, {
					timeEntry: { originalInput: input.value },
					isPopupOpen: false,
					manualMode: true,
					origin: inputWrapper,
				});
			},
			{ once: true }
		);

		/* aBrowser.storage.local.get(['workspaceSettings'], result => {
			result = JSON.parse(result.workspaceSettings);
			if (result.timeTrackingMode === 'STOPWATCH_ONLY') {
				form.style.display = 'none';
				const manualInputBackgroundTrello = $('.input-button-link');
				if (manualInputBackgroundTrello) manualInputBackgroundTrello.style.display = 'none';
			} else {
				form.style.display = 'inline-block';
				const manualInputBackgroundTrello = $('.input-button-link');
				if (manualInputBackgroundTrello)
					manualInputBackgroundTrello.style.display = 'inline-block';
			}
		});
		aBrowser.storage.local.get(['wsCustomFields'], result => {
			if (!result.wsCustomFields) return;
			const cfFields = JSON.parse(result.wsCustomFields);
			cfFields.forEach(field => {
				if (field.required) {
					cfFieldsRequired = true;
				}
			});
		}); */

		form.onsubmit = async e => {
			e.preventDefault();
			e.stopPropagation();

			const response = await aBrowser.runtime.sendMessage({
				eventName: 'getEntryInProgress',
			});
			if (response === 'Forbidden') {
				alert(clockifyLocales.WORKSPACE_LOCKED);
				return;
			}

			let workspaceSettings = await localStorage.getItem('workspaceSettings');
			workspaceSettings = JSON.parse(workspaceSettings);
			if (
				workspaceSettings.features &&
				workspaceSettings.features.featureSubscriptionType !== 'SELF_HOSTED' &&
				!workspaceSettings.features.timeTracking
			) {
				const isUserOwnerOrAdmin = await localStorage.getItem('isUserOwnerOrAdmin');
				const wasRegionalEverAllowed = await localStorage.getItem('wasRegionalEverAllowed');
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

			// remove form if force timer enabled
			// format options so that if a function is passed we get its return value
			// as part of the options objects key value pairs
			const timeEntryOptionsInvoked = objInvokeIfFunction(options);

			let title = timeEntryOptionsInvoked.description;

			if (await isAppendUrlEnabled()) {
				title = withAppendedUrl(title);
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
					aBrowser.storage.local.get(['wsSettings'], async result => {
						const { wsSettings } = result;
						const hasDescriptionValue = Boolean(title);

						if (await isPopupShowable({ hasDescriptionValue })) {
							if (
								timeEntryOptionsInvoked.projectName ||
								timeEntryOptionsInvoked.tagNames
							) {
								const response = await aBrowser.runtime.sendMessage({
									eventName: 'generateManualEntryData',
									options: timeEntryOptionsInvoked,
								});

								const inputWrapper = input.parentElement;

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
									tagIds: response.tags?.map(tag => tag.id) ?? [],
									project: response.project,
									task: response.task,
								};
								window.updateButtonProperties(null, {
									timeEntry,
									manualMode: true,
									isPopupOpen: true,
									origin: inputWrapper,
									integrationName:
										clockifyButton?.injectedArguments?.integrationName,
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
								const inputWrapper = input.parentElement;
								window.updateButtonProperties(null, {
									timeEntry,
									manualMode: true,
									isPopupOpen: true,
									origin: inputWrapper,
									integrationName:
										clockifyButton?.injectedArguments?.integrationName,
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
										integrationName:
											clockifyButton?.injectedArguments?.integrationName,
									},
								},
								response => {
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

	createEvent: ({ description, start, end }) => {
		const icon = `<svg width="16" height="16" viewBox="0 0 17 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.50307 10.027H5.51427C5.76592 10.027 5.96945 9.761 5.96945 9.51C5.96945 9.259 5.76592 9.024 5.51427 9.024H3.50307C3.25142 9.024 3.04789 9.259 3.04789 9.51C3.04789 9.761 3.25142 10.027 3.50307 10.027ZM8.53309 13.041H3.50307C3.25142 13.041 3.04789 13.276 3.04789 13.527C3.04789 13.778 3.25142 14.012 3.50307 14.012H8.53309C8.78474 14.012 8.98826 13.778 8.98826 13.527C8.98826 13.276 8.78474 13.041 8.53309 13.041ZM6.52188 15.018H3.50307C3.25142 15.018 3.04789 15.253 3.04789 15.504C3.04789 15.755 3.25142 15.989 3.50307 15.989H6.52188C6.77453 15.989 6.97806 15.755 6.97806 15.504C6.97806 15.253 6.77453 15.018 6.52188 15.018ZM13.4027 0H6.81865C5.81204 0 4.99593 0.814 4.99593 1.818V3.556C4.99593 3.807 5.23154 4.011 5.48319 4.011C5.73484 4.011 5.96945 3.807 5.96945 3.556V1.818C5.96945 1.316 6.37751 0.971 6.88081 0.971H12.0362V4.042C12.0362 4.544 12.4442 5.013 12.9475 5.013H16.0265V14.135C16.0265 14.637 15.6806 15.044 15.1773 15.044H13.2152C12.9636 15.044 12.759 15.279 12.759 15.529C12.759 15.781 12.9636 16.015 13.2152 16.015H15.1773C16.1839 16.015 17 15.139 17 14.135V4.042L13.4027 0ZM13.0097 4.042V1.041L15.6686 4.042H13.0097ZM1.82272 5.013C0.816112 5.013 0 5.827 0 6.831V18.18C0 19.184 0.816112 19.998 1.82272 19.998H10.1192C11.1258 19.998 12.0051 19.184 12.0051 18.18V9.024L8.65841 5.013H1.82272ZM11.0306 18.117C11.0306 18.62 10.6225 19.026 10.1192 19.026H1.88588C1.38258 19.026 0.974522 18.62 0.974522 18.117V6.831C0.974522 6.329 1.38258 5.985 1.88588 5.985H7.00914V9.024C7.00914 9.526 7.48036 10.027 7.98366 10.027H11.0306V18.117ZM7.98366 9.024V6.055L10.6726 9.024H7.98366ZM3.04789 11.518C3.04789 11.77 3.25142 12.004 3.50307 12.004H8.53309C8.78474 12.004 8.98826 11.77 8.98826 11.518C8.98826 11.268 8.78474 11.033 8.53309 11.033H3.50307C3.25142 11.033 3.04789 11.268 3.04789 11.518Z" fill="#606266"/></svg>`;
		const text = '<div>Copy as time entry</div>';

		const container = createTag('div', 'clockify-copy-as-entry-container');

		container.innerHTML = `${icon} ${text}`;

		const timeEntry = { description, start, end };

		container.addEventListener('click', () =>
			clockifyButton.handleEventClick(timeEntry, container)
		);

		setTimeout(
			() =>
				window.updateButtonProperties(null, {
					isPopupOpen: false,
					copyAsEntry: true,
					origin: container,
				}),
			200
		);

		return container;
	},
	handleEventClick: async ({ description, start, end }, container) => {
		const defaultProjectSettings = await aBrowser.runtime.sendMessage({
			eventName: 'getDefaultProjectTask',
		});

		description = invokeIfFunction(description);

		if (await isAppendUrlEnabled()) {
			description = withAppendedUrl(description);
		}

		const { projectDB, taskDB } = defaultProjectSettings;

		const response = await localStorage.getItem('workspaceSettings');
		const { lockTimeEntries } = JSON.parse(response);
		const firstUnlockedDate = new Date(lockTimeEntries);
		const isStartDateLocked = firstUnlockedDate.getTime() > start.getTime();

		function addDaysUntilUnlockedDay(time) {
			const timeInMilliseconds = time.getTime();
			const firstUnlockedDateInMilliseconds = firstUnlockedDate.getTime();
			const timeUntilUnlockedDate = Math.abs(
				firstUnlockedDateInMilliseconds - timeInMilliseconds
			);
			const daysUntilUnlockedDate = Math.ceil(timeUntilUnlockedDate / (1000 * 60 * 60 * 24));

			const firstUnlockedDay = new Date(
				timeInMilliseconds + daysUntilUnlockedDate * 24 * 60 * 60 * 1000
			);

			return firstUnlockedDay;
		}

		const isUserOwnerOrAdmin = await localStorage.getItem('isUserOwnerOrAdmin');

		if (isStartDateLocked && !isUserOwnerOrAdmin) {
			start = addDaysUntilUnlockedDay(start);
			end = addDaysUntilUnlockedDay(end);
		}

		const timeEntry = {
			description: description,
			projectId: projectDB?.id,
			taskId: taskDB?.id,
			billable: projectDB?.billable,
			project: projectDB,
			task: taskDB,
			timeInterval: { start, end },
		};

		const hasDescriptionValue = Boolean(description);

		if (await isPopupShowable({ hasDescriptionValue })) {
			window.updateButtonProperties(null, {
				timeEntry,
				isPopupOpen: true,
				copyAsEntry: true,
				origin: container,
			});
		} else {
			const options = { timeEntryOptions: timeEntry };

			aBrowser.runtime.sendMessage({ eventName: 'submitTime', options });

			alert('Time entry has been created');
		}
	},

	observeDarkMode: isThemeDark => {
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

			const style = createTag('style', 'clockify-custom-style-dark', darkThemeStyle);

			document.head.append(style);
		}

		function removeDarkThemeStyle() {
			$('.clockify-custom-style-dark')?.remove();
		}

		observeThemeChange();
		updateColorStyle();
	},
};

function getClockifyButtonHTML({ isActive, isSmall, options }) {
	const activeIcon = `<svg width="15"height="16"viewBox="0 0 15 16"fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.0065 2.04616C11.4838 1.56806 11.3811 0.764579 10.7508 0.522636C9.8712 0.185007 8.91622 0 7.91809 0C3.54505 0 0 3.5511 0 7.93162C0 12.3121 3.54505 15.8632 7.91809 15.8632C8.91006 15.8632 9.85941 15.6805 10.7345 15.3468C11.3664 15.1059 11.4702 14.3009 10.992 13.8219C10.6822 13.5115 10.2133 13.4391 9.79745 13.5775C9.20813 13.7738 8.57779 13.88 7.92268 13.88C4.6429 13.88 1.9841 11.2167 1.9841 7.93131C1.9841 4.64592 4.6429 1.98259 7.92268 1.98259C8.58253 1.98259 9.21724 2.09041 9.81022 2.28937C10.2263 2.42902 10.6962 2.35702 11.0065 2.04616Z" fill="#03A9F4"/><path d="M9.11681 8.02279C9.11681 8.57666 8.66782 9.02564 8.11396 9.02564C7.5601 9.02564 7.11111 8.57666 7.11111 8.02279C7.11111 7.46893 7.5601 7.01994 8.11396 7.01994C8.66782 7.01994 9.11681 7.46893 9.11681 8.02279Z" fill="#03A9F4"/><path d="M9.65974 5.15543C9.3005 5.5124 9.3005 6.09115 9.65974 6.44812C10.019 6.80509 10.6014 6.80509 10.9607 6.44812L13.9528 3.47494C14.312 3.11797 14.312 2.53922 13.9528 2.18225C13.5936 1.8253 13.0111 1.8253 12.6519 2.18225L9.65974 5.15543Z" fill="#03A9F4"/><path d="M9.65974 10.7078C9.3005 10.3508 9.3005 9.7721 9.65974 9.41513C10.019 9.05816 10.6014 9.05816 10.9607 9.41513L13.9528 12.3883C14.312 12.7453 14.312 13.324 13.9528 13.681C13.5936 14.0379 13.0111 14.0379 12.6519 13.681L9.65974 10.7078Z" fill="#03A9F4"/> </svg>`;
	const inactiveIcon = `<svg width="16" 	height="16" 	viewBox="0 0 16 16" 	xmlns="http://www.w3.org/2000/svg" > 	<path 		d="M11.0065 2.04616C11.4838 1.56806 11.3811 0.764579 10.7508 0.522636C9.8712 0.185007 8.91622 0 7.91809 0C3.54505 0 0 3.5511 0 7.93162C0 12.3121 3.54505 15.8632 7.91809 15.8632C8.91006 15.8632 9.85941 15.6805 10.7345 15.3468C11.3664 15.1059 11.4702 14.3009 10.992 13.8219C10.6822 13.5115 10.2133 13.4391 9.79745 13.5775C9.20813 13.7738 8.57779 13.88 7.92268 13.88C4.6429 13.88 1.9841 11.2167 1.9841 7.93131C1.9841 4.64592 4.6429 1.98259 7.92268 1.98259C8.58253 1.98259 9.21724 2.09041 9.81022 2.28937C10.2263 2.42902 10.6962 2.35702 11.0065 2.04616Z" 		fill="#60747D" 	/> 	<path 		d="M9.11681 8.02279C9.11681 8.57666 8.66782 9.02564 8.11396 9.02564C7.5601 9.02564 7.11111 8.57666 7.11111 8.02279C7.11111 7.46893 7.5601 7.01994 8.11396 7.01994C8.66782 7.01994 9.11681 7.46893 9.11681 8.02279Z" 		fill="#60747D" 	/> 	<path 		d="M9.65974 5.15543C9.3005 5.5124 9.3005 6.09115 9.65974 6.44812C10.019 6.80509 10.6014 6.80509 10.9607 6.44812L13.9528 3.47494C14.312 3.11797 14.312 2.53922 13.9528 2.18225C13.5936 1.8253 13.0111 1.8253 12.6519 2.18225L9.65974 5.15543Z" 		fill="#60747D" 	/> 	<path 		d="M9.65974 10.7078C9.3005 10.3508 9.3005 9.7721 9.65974 9.41513C10.019 9.05816 10.6014 9.05816 10.9607 9.41513L13.9528 12.3883C14.312 12.7453 14.312 13.324 13.9528 13.681C13.5936 14.0379 13.0111 14.0379 12.6519 13.681L9.65974 10.7078Z" 		fill="#60747D" 	/> </svg>`;

	const container = document.createElement('div');
	const text = document.createElement('span');

	const { START_TIMER, STOP_TIMER } = clockifyLocales;

	const activeButtonClasses = `clockify-button-active clockify-button-active-span`;
	const inactiveButtonClasses = `clockify-button-inactive clockify-button-inactive-span`;

	const buttonClasses = isActive ? activeButtonClasses : inactiveButtonClasses;
	const buttonText = isActive ? STOP_TIMER : START_TIMER;
	const icon = isActive ? activeIcon : inactiveIcon;

	text.innerHTML = `<span class="${buttonClasses}">${buttonText}</span>`;

	const { inactiveButtonColor } = options;

	text.style.color = isActive ? '#03A9F4' : inactiveButtonColor ?? '#444444';

	container.innerHTML = icon;

	if (!isSmall) container.append(text);

	return container;
}

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
		.map(context => context.querySelectorAll(selector))
		.map(nodeList => Array.from(nodeList))
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
		.map(element => element.textContent)
		.filter(value => Boolean(value))
		.map(text => text.trim());

	return withoutDuplicates ? [...new Set(texts)] : texts;
}

function timeout({ milliseconds }) {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function waitForElement(selector, context = document) {
	return new Promise(resolve => {
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

function getCssValue(element, cssProperty) {
	if (!(element instanceof HTMLElement)) return console.error(`First argument must be element.`);

	const value = getComputedStyle(element, null).getPropertyValue(cssProperty);

	return value;
}

function applyStyles(css, classNames = 'clockify-custom-styles') {
	removeStyles(classNames);

	const style = createTag('style', classNames, css);

	document.head.append(style);
}

function removeStyles(classNames = 'clockify-custom-styles') {
	const selector = classNames
		.split(' ')
		.map(className => `.${className}`)
		.join('');

	$(selector)?.remove();
}

function createContainer() {
	const container = createTag('div', 'clockify-widget-container');

	container.append(...arguments);

	return container;
}

async function setManualElementsVisibility() {
	const invisibleElementsStyles = `#clockify-manual-input-form, .clockify-copy-as-entry-container, .input-button-link { display: none !important; }`;
	const invisibleElementsClassName = `clockify-hide-manual-elements`;

	if (await isManuallyDisabled()) {
		applyStyles(invisibleElementsStyles, invisibleElementsClassName);
	} else {
		removeStyles(invisibleElementsClassName);
	}
}

async function isManuallyDisabled() {
	const response = await localStorage.getItem('workspaceSettings');
	const { timeTrackingMode } = JSON.parse(response || '{}');

	return timeTrackingMode === 'STOPWATCH_ONLY';
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

function isAppendUrlEnabled() {
	return localStorage.getItem('permanent_appendWebsiteURL');
}

function withAppendedUrl(text) {
	const sufix = `${document.title} - ${window.location.href}`;
	const separator = text.includes(' | ') ? ' || ' : ' | ';
	const isUrlAppended = text.endsWith(sufix);

	const textWithAppendedUrl = isUrlAppended ? text : `${text}${separator}${sufix}`;

	return textWithAppendedUrl;
}

function withoutAppendedUrl(text, separator) {
	return text?.split(separator)[0];
}

async function isPopupShowable({ hasDescriptionValue }) {
	const wsCustomFieldsUnparsed = await localStorage.getItem('wsCustomFields');
	const wsSettingsUnparsed = await localStorage.getItem('workspaceSettings');

	const wsCustomFields = JSON.parse(wsCustomFieldsUnparsed || '[]');
	const wsSettings = JSON.parse(wsSettingsUnparsed || '{}');

	const { forceDescription, forceProjects, forceTasks, forceTags } = wsSettings;

	const isAnyRegularRequiredFieldMissing =
		(forceDescription && !hasDescriptionValue) || forceProjects || forceTasks || forceTags;
	const isAnyCustomRequiredFieldMissing = wsCustomFields.find(({ required }) =>
		Boolean(required)
	);

	const isAnyRequiredFieldMissing =
		isAnyRegularRequiredFieldMissing || isAnyCustomRequiredFieldMissing;
	const isPostStartPopupEnabled = _clockifyShowPostStartPopup;

	return isAnyRequiredFieldMissing || isPostStartPopupEnabled;
}

function closestClockifyButton(rootElement, clockifyButtonSelector = '.clockifyButton') {
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

	const isSmall = button.classList.contains('small');
	const idAttribute = isSmall ? 'clockifySmallButton' : 'clockifyButton';

	button.classList.add('clockifyButton', 'clockifyButtonId' + buttonId);
	button.setAttribute('id', idAttribute);

	window.updateButtonProperties(
		{
			title,
			active,
			small: isSmall,
			buttonId,
		},
		{
			inProgressDescription: clockifyButton.inProgressDescription,
		}
	);
}

function updateButtonOnProgressChanged(timeEntry) {
	const { newValue: timeEntryInProgress, oldValue: oldTimeEntryValue } = timeEntry;

	clockifyButton.inProgressDescription =
		timeEntryInProgress && timeEntryInProgress.id ? timeEntryInProgress.description : '';

	const allButtons = $$$('.clockifyButton');

	allButtons.forEach(button => {
		const buttonId = button.className.match(/clockifyButtonId(\d+)/)[1];
		const title = button.title || button.dataset.title; // fix for Zoho Desk bug with disappearing title atributte
		const pipeSeparator = title?.includes(' | ') ? ' || ' : ' | ';
		const titleWoURL = withoutAppendedUrl(title, pipeSeparator);
		const currentEntryDescriptionWoURL = withoutAppendedUrl(
			timeEntryInProgress?.description,
			pipeSeparator
		);

		const previousEntryDescriptionWoURL = withoutAppendedUrl(
			oldTimeEntryValue?.description,
			pipeSeparator
		);

		const active = timeEntryInProgress && titleWoURL === currentEntryDescriptionWoURL;

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

function removeAllClockifyStyles() {
	const clockifyStyles = Array.from($$('style[class^="clockify"]'));

	clockifyStyles.forEach(style => style.remove());
}

async function hideClockifyButtonLinks() {
	const css = `
		.clockify-widget-container,
		#clockifyButton, 
		#clockify-manual-input-form,
		.clockify-copy-as-entry-container { 
			display: none !important; 
		}
	`;
	const style = document.createElement('style');

	style.innerText = css;
	document.head.append(style);
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
		clockifyChanges: e => {
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
		clockifyRemovePopupDlg: e => {
			const divPopupDlg = document.getElementById('divClockifyPopupDlg');
			if (divPopupDlg && !divPopupDlg.contains(e.target)) {
				const divProjectDropDownPopup = document.getElementById(
					'divClockifyProjectDropDownPopup'
				);
				const divTagDropDownPopup = document.getElementById('divClockifyTagDropDownPopup');
				if (
					(divProjectDropDownPopup && divProjectDropDownPopup.contains(e.target)) ||
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
	const buttons = $$$(wrapperClass || '.clockifyButton, #clockify-manual-input-form');
	const divs = $$$('.clockify');

	buttons.forEach(button => button.parentNode.removeChild(button));
	divs.forEach(div => div.classList.remove('clockify'));
}

async function setPostStartPopup() {
	const appStore = await localStorage.getItem('appStore');
	const showPostStartPopup = JSON.parse(appStore).state.showPostStartPopup;

	_clockifyShowPostStartPopup = showPostStartPopup;
}

function clockifyDestroyPopupDlg() {
	const divPopupDlg = document.getElementById('divClockifyPopupDlg');
	if (divPopupDlg) {
		if (window.clockifyListeners) {
			window.removeEventListener('click', window.clockifyListeners.clockifyClicks, true);
			window.removeEventListener('change', window.clockifyListeners.clockifyChanges, true);
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
	const timeEntryInProgressChanged = changedItems.find(item => {
		return item === 'timeEntryInProgress';
	});
	if (timeEntryInProgressChanged) {
		const timeEntry = changes['timeEntryInProgress'];
		_timeEntryInProgressDescription = timeEntry?.newValue?.description;
		this.updateButtonOnProgressChanged(timeEntry);
	}

	if (changedItems.find(item => item === 'token')) {
		aBrowser.storage.local.get(['token'], result => {
			if (!result.token) {
				this.hideClockifyButtonLinks();
				removeAllClockifyStyles();
			}
		});
	}

	if (changedItems.find(item => item === 'appStore')) {
		setPostStartPopup();
	}

	if (changedItems.find(item => item === 'wsSettings')) {
		if (_clockifyShowPostStartPopup) {
			aBrowser.storage.local.get(['wsSettings'], result => {
				// ClockifyEditForm.prototype.wsSettings = result.wsSettings;
			});
		}
	}

	if (changedItems.find(item => item === 'workspaceSettings')) {
		aBrowser.storage.local.get(['workspaceSettings'], result => {
			const workspaceSettingsChanged = new CustomEvent('workspaceSettingsChanged');

			window.dispatchEvent(workspaceSettingsChanged);

			setManualElementsVisibility();
		});
	}

	if (changedItems.find(item => item === 'integrationAlert')) {
		aBrowser.storage.local.get(['integrationAlert'], result => {
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

function onMessageListener(request, sender, sendResponse) {
	if (request.eventName === 'cleanup') {
		cleanup();
	}

	if (request.eventName === 'rerenderIntegrations') {
		clockifyButton.rerenderAllButtons();
	}

	if (request.eventName === 'urlChanged') {
		const urlChanged = new CustomEvent('urlChanged');

		window.dispatchEvent(urlChanged);
	}

	if (request.eventName === 'passArgumentsToClockifyButton') {
		// console.log('Active integration name:', request.options.integrationName);
		// console.log('PASS options', request.options);
		clockifyButton = {
			...clockifyButton,
			injectedArguments: request.options,
		};
		//console.log('Analytics data:', request);
	}
}

aBrowser.runtime.onMessage.addListener(onMessageListener);
