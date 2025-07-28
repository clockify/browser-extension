addCustomCSS();
initializeHtmlTagObserver();

// Task sidebar
clockifyButton.render(
	'#clockify-extension-container:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	placeholder => {
		const plakyTaskName = () => placeholder.getAttribute('data-item-title');
		const plakyBoardName = () => placeholder.getAttribute('data-board-title');

		const description = () => plakyTaskName();
		const projectName = () => plakyBoardName().split(':')?.[0]?.trim();
		const taskName = () => plakyBoardName().split(':')?.[1]?.trim();

		const entry = { description, projectName, taskName };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		placeholder.append(container);
	}
);

function addCustomCSS() {
	const isThemeLight = document.documentElement.getAttribute('data-theme').includes('light');

	applyStyles(`
		#clockify-extension-container {
			display: block !important;
			height: 40px !important;
		}

		.clockify-widget-container {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			margin-left: 1rem;
			padding-top: 0.5rem;
			gap: 2rem;
		}

		.clockify-input {
			border-color: #c7c6d94d !important;
			background-color: ${isThemeLight ? '#c7c6d94d' : '#79789c4d'} !important;
			color: ${isThemeLight ? '#13121d8c' : 'rgba(242,242,248,.87)'} !important;
		}

		.clockify-input::placeholder {
			color: ${isThemeLight ? '#13121d8c' : '#f2f2f880'};
		}

		.clockify-button-inactive {
			color: ${isThemeLight ? '#444' : 'rgba(242,242,248,.87)'} !important;
		}
	`);
}

function initializeHtmlTagObserver() {
	const htmlTagObserver = new MutationObserver(addCustomCSS);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true };

	htmlTagObserver.observe(observationTarget, observationConfig);
}
