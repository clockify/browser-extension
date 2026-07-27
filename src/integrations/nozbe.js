(async () => {
	await timeout({ milliseconds: 300 });
	const selectors = await getSelectors('nozbe', 'sideTaskView');

	// app.nozbe.com
	clockifyButton.render('#details-container', { observe: true }, async taskContainer => {
		if ($('[class*="clockify"]', taskContainer)) return;

		const leftColumn = await waitForElement('.details__attributes-left');
		const rightColumn = await waitForElement('.details__attributes-right');

		const timerContainerClasses = `details__attribute details__attribute--undefined clockify-widget-container`;
		const inputContainerClasses = `details__attribute details__attribute--undefined clockify-widget-container`;

		const timerContainer = createTag('div', timerContainerClasses);
		const inputContainer = createTag('div', inputContainerClasses);

		const description = () => text('.details__title-name');

		const timer = clockifyButton.createTimer({ description });
		const input = clockifyButton.createInput({ description });

		timerContainer.append(timer);
		inputContainer.append(input);

		applyStyles(`
				input.clockify-input { background-color: inherit !important; border: none !important; width: fit-content;}
				.clockify-widget-container { margin-top: 3px !important; height: 37px; }
			`);

		leftColumn && leftColumn.append(timerContainer);
		rightColumn && rightColumn.append(inputContainer);
	});

	clockifyButton.render(
		selectors.hanger,
		{ observe: true, onNavigationRerender: true },
		async elem => {
			await timeout({ milliseconds: 500 });
			if ($('.clockifyButton')) return;

			const description = () => text(selectors.description);

			const timer = clockifyButton.createSmallButton({ description });

			timer.style.margin = '5px';

			elem.append(timer);

			applyStyles(`
				.clockifyButton * { 
					cursor: pointer; 
				}
			`);
		}
	);
	// nozbe.app
})();

initializeBodyObserver();
applyManualInputStyles();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true, attributeFilter: ['data-theme'] };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const isDarkMode =
		document.documentElement.attributes.getNamedItem('data-theme').value === 'dark';
	setTimeout(clockifyButton.rerenderAllButtons, 0);

	const darkStyles = `
		.clockify-button-inactive { 
			color: rgba(242, 242, 248, .87) !important; 
		}
		
		.clockify-input {
			border-color: #444 !important;
			background-color: #2C2C2C !important;
			color: rgb(171, 171, 171) !important;
		}
		
		.clockify-input::placeholder {
			color: #13121d8c';
		}
	`;

	const lightStyles = `
		.clockify-button-inactive { 
			color: #444 !important 
		}
		
		.clockify-input {
			background-color: white !important;
			color: #13121d8c !important;
		}
		
		.clockify-input::placeholder {
			color: #13121d8c';
		}
	`;

	const stylesToApply = isDarkMode ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
