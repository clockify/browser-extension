(async () => {
	const selectors = await getSelectors('trello');

	/* Board view - card */
	clockifyButton.render(
		selectors.cardBoardView.hanger,
		{
			observe: true,
			onNavigationRerender: true,
			showTimerOnhover: '[data-testid="trello-card"]',
		},
		card => {
			const description = () => text(selectors.cardBoardView.cardTitle, card);
			const projectName = () => text(selectors.cardBoardView.boardTitle);

			const entry = { description, projectName, small: true };

			const timer = clockifyButton.createTimer(entry);

			card.style.minHeight = '60px';
			card.style.paddingRight = '15px';

			timer.style.position = 'absolute';
			timer.style.right = '2px';
			timer.style.bottom = '8px';
			timer.style.zIndex = '9999';
			timer.style.display = 'flex';

			card.append(timer);
		}
	);

	/* Modal view - right sidebar */
	clockifyButton.render(
		'[data-testid=\"card-back-name\"] header:not(.clockify)',
		{ observe: true },
		modal => {
			const description = () => text(selectors.rightSidebarModalView.modalTitle);
			const projectName = () => text(selectors.rightSidebarModalView.boardTitle);

			const entry = { description, projectName, small: true };

			const timer = clockifyButton.createTimer(entry);
			const input = clockifyButton.createInput(entry);

			const container = createContainer(timer, input);

			/* positioning */
			const actions = $('[type="button"]', modal);
			const modalRect = modal.getBoundingClientRect();
			const buttonRect = actions.getBoundingClientRect();
			const right = modalRect.right - buttonRect.left;

			container.style.position = 'absolute';
			container.style.top = '14px';
			container.style.right = `${right + 5}px`;
			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.style.justifyContent = 'center';
			container.style.gap = '10px';
			container.style.zIndex = '1337';

			container.prepend(input);
			container.prepend(timer);

			modal.prepend(container);
		}
	);

	/* Modal view - checklist */
	clockifyButton.render(
		selectors.checklistModalView.hanger,
		{ observe: true, showTimerOnhover: '[data-testid="check-item-name"]' },
		checklistItem => {
			const checklistTitle = () => checklistItem.textContent.trim();
			const modalTitle = () => text(selectors.checklistModalView.modalTitle);

			const description = () => `${checklistTitle()} - ${modalTitle()}`;
			const projectName = () => text(selectors.checklistModalView.boardTitle);

			const entry = { description, projectName, small: true };

			const timer = clockifyButton.createTimer(entry);

			checklistItem.append(timer);
		}
	);
})();

initializeHtmlObserver();
applyManualInputStyles();

function initializeHtmlObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const lightStyles = `
		header form#clockify-manual-input-form {
			background-color: white;
   			border-radius: 5px;
		}
		header div#clockifySmallButton {
			background-color: white;
			padding: 7px;
			border-radius: 50%;
		}
		span.clockify-button-inactive {
			color: #444444 !important;
		}
		input.clockify-input {
			color: #444444 !important;
			border: none !important;
			padding: 0 18px !important;
			border-radius: 5px;
			background: rgba(161, 189, 217, 0.08) !important;
		}
	`;
	const darkStyles = `
		header form#clockify-manual-input-form {
			background-color: #2d3033;
   			border-radius: 5px;
		}
		header	 div#clockifySmallButton {
			background-color: #2d3033	;
			padding: 6px;
			border-radius: 50%;
		}
		span.clockify-button-inactive {
			color: rgb(182, 194, 207) !important;
		}
		input.clockify-input {
			color: rgb(182, 194, 207) !important;
			border: none !important;
			padding: 0 18px !important;
			border-radius: 5px;
			background: rgba(161, 189, 217, 0.08) !important;
		}
	`;

	const isThemeDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
	const stylesToApply = isThemeDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
