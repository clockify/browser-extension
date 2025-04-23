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
	clockifyButton.render(selectors.rightSidebarModalView.hanger, { observe: true }, copyButton => {
		const description = () => text(selectors.rightSidebarModalView.modalTitle);
		const projectName = () => text(selectors.rightSidebarModalView.boardTitle);

		const entry = { description, projectName };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		input.children[0].style.boxShadow = 'none';
		input.children[0].style.padding = '4px';
		input.children[0].style.margin = '0';
		timer.style.marginBottom = '5px';

		const sidebar = copyButton.parentElement.parentElement;

		container.prepend(input);
		container.prepend(timer);

		sidebar.prepend(container);
	});

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
		span.clockify-button-inactive {
			color: #444444 !important;
		}
		input.clockify-input {
			color: #444444 !important;
			width: 100%;
			border: none !important;
			padding: 0 18px !important;
			background: rgba(9, 30, 66, 0.06) !important;
		}
	`;
	const darkStyles = `
		span.clockify-button-inactive {
			color: rgb(182, 194, 207) !important;
		}
		input.clockify-input {
			color: rgb(182, 194, 207) !important;
			width: 100%;
			border: none !important;
			padding: 0 18px !important;
			background: rgba(161, 189, 217, 0.08) !important;
		}
	`;

	const isThemeDark = document.documentElement.getAttribute('data-color-mode') === 'dark';
	const stylesToApply = isThemeDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
