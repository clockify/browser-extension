// Window
clockifyButton.render(
	'.notion-topbar-action-buttons:not(.clockify)',
	{ observe: true },
	actionsBar => {
		const description = () => text('.notion-scroller .notranslate[contenteditable=true]') || '';

		const timer = clockifyButton.createTimer({ description });
		const input = clockifyButton.createInput({ description });

		const container = createContainer(timer, input);

		timer.style.marginRight = '10px';
		$('input', input).style.paddingLeft = '5px';
		$('input', input).style.borderRadius = '5px';

		container.style.margin = '0 10px';
		container.style.display = 'flex';
		container.style.alignItems = 'center';

		container.append(timer);
		container.append(input);

		!$('[class*="clockify"]', actionsBar) && actionsBar.prepend(container);

		blockNotionKeyEvents($('input', input));
	}
);

// Task
clockifyButton.render(
	'.notion-peek-renderer:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	elem => {
		const modal = $('div:nth-child(2)', elem);
		if (!modal) return;
		const modalHeader = $('div:first-child > div:first-child', modal);
		const firstHeaderElement = $('div > div:first-child > div:first-child', modalHeader);

		const description = () =>
			text('.notion-scroller .notranslate[contenteditable=true]', elem) || '';

		const timer = clockifyButton.createTimer({ description });
		const input = clockifyButton.createInput({ description });

		const container = createContainer(timer, input);

		timer.style.marginRight = '10px';
		$('input', input).style.borderRadius = '5px';

		container.style.margin = '0 20px';
		container.style.display = 'flex';
		container.style.flexShrink = 0;
		container.style.alignItems = 'center';

		container.append(timer);
		container.append(input);

		!$('[class*="clockify"]', firstHeaderElement) && firstHeaderElement.after(container);

		blockNotionKeyEvents($('input', input));
	}
);

function blockNotionKeyEvents(clockifyInput) {
	const eventNames = ['keypress', 'keydown', 'keyup'];

	eventNames.forEach(eventName =>
		clockifyInput.addEventListener(eventName, event => event.stopPropagation())
	);
}

initializeHtmlObserver();
applyManualInputStyles();

function initializeHtmlObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.body;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const lightStyles = `
		span.clockify-button-inactive {
			color: #444444 !important;
		}
		input.clockify-input {
			color: #444444 !important;
			background: #fff !important;
			border: 1px solid #dcdcde !important;
		}
		input.clockify-input::placeholder {
			color: #444444 !important;
		}
	`;
	const darkStyles = `
		span.clockify-button-inactive {
			color: #f0efed !important;
		}
		input.clockify-input {
			color: #f0efed !important;
			border: none !important;
			background: hsla(0,0%,100%,.055) !important;
		}
		input.clockify-input::placeholder {
			color: #f0efed !important;
		}
	`;

	const isThemeDark = document.body.classList.contains('notion-dark-theme');

	const stylesToApply = isThemeDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
