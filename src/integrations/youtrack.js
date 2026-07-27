// Issue cards view
clockifyButton.render(
	'.yt-agile-card:not(.clockify)',
	{ observe: true, showTimerOnhover: '[data-test="yt-agile-board-card"]' },
	youtrackCard => {
		const cardId = () => text('.yt-agile-card__summary span:nth-child(1) a', youtrackCard);
		const cardTitle = () => text('.yt-agile-card__summary span:nth-child(2)', youtrackCard);

		const description = () => `${cardId()} ${cardTitle()}`;
		const tagNames = () => textList('.yt-issue-tags__tag', youtrackCard);

		const entry = { description, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.style.position = 'absolute';
		timer.style.top = '10px';
		timer.style.right = '10px';

		youtrackCard.append(timer);
	}
);

// Issue page view
clockifyButton.render(
	'[data-test="issue-container"]:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async issueContainer => {
		await timeout({ milliseconds: 500 });

		if ($('.clockify-widget-container', issueContainer)) return;
		// when view goes to edit mode and back, rerender buttons
		observeEditIssue();
		// rerender on edit close
		const ticketId = () =>
			text('[data-test=breadcrumbs-container] [id*="id-link"]') || text('[id*="id-link"]');
		const ticketTitle = () => text('[data-test="ticket-summary"]', issueContainer);

		const description = () => `${ticketId()} ${ticketTitle()}`;
		const projectName = () => text('[aria-label="Project"] span[class^="fieldValue"]');
		const tagNames = () => textList('[class*="tags"] a', issueContainer);

		const entry = { description, projectName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		input.style.marginLeft = '16px';

		const container = createContainer(timer, input);

		container.style.display = 'flex';
		container.style.alignItems = 'center';

		const modalHeader = $('[class*="header__"]', issueContainer);

		modalHeader.append(container);
	}
);

// Issue modal view
clockifyButton.render(
	'[data-test*="ticket-view-dialog"]:not(.clockify)',
	{ observe: true },
	async taskModal => {
		await timeout({ milliseconds: 1000 });

		// when view goes to edit mode and back, rerender buttons
		observeEditIssue();
		await waitForElement('[data-test="fields-sidebar"]', taskModal);

		const ticketId = () => text('[id*="id-link"]', taskModal);
		const ticketTitle = () => text('[data-test="ticket-summary"]', taskModal);

		const description = () => `${ticketId()} ${ticketTitle()}`;
		const projectName = () => text('[aria-label="Project"] span[class^="fieldValue"]');
		const tagNames = () => textList('[class*="tags"] a', taskModal);

		const entry = { description, projectName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		input.style.marginLeft = '16px';

		const container = createContainer(timer, input);

		container.style.display = 'flex';
		container.style.alignItems = 'center';

		const modalHeader = $('[class*="header__"]', taskModal);

		modalHeader.append(container);
	}
);

applyStyles(`
	.clockify-widget-container {
		display: flex;
		flex: 1;
		justify-content: end;
	}
`);

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { childList: true, attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const isDarkThemeEnabled = Array.from(document.documentElement.classList)
		.join(' ')
		.includes('dark');

	const darkStyles = `
		#clockify-manual-input-form input { background: #28343d !important; color: #f5f4f3 !important; border: none !important; }
		#clockify-manual-input-form input:hover { border-color: #6a696a !important; transition: border-color 100ms; }
		.clockify-button-inactive { color: #f5f4f3 !important; }
	`;
	const lightStyles = `
		.clockify-input { background: white !important; color: #28343d !important; border: 1px solid #dcdcde !important; }
		.clockify-input:hover { border-color: #cfcbcb !important; transition: border-color 100ms; }
		.clockify-button-inactive { color: #444444 !important };
	`;

	const stylesToApply = isDarkThemeEnabled ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}

function observeEditIssue() {
	const attributeObserver = new MutationObserver(() => {
		if (document.querySelector('[data-test="view-mode"]')) {
			clockifyButton.rerenderAllButtons();
		}
	});
	const observationTarget = document.querySelector('[class*="ticketContentInner"]');

	if (observationTarget) {
		const observationConfig = {
			attributes: true,
			attributeFilter: ['data-test'],
		};

		attributeObserver.observe(observationTarget, observationConfig);
	}
}
