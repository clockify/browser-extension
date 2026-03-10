(async () => {
	const selectors = await getSelectors('monday', 'allViews');

	// "Kanban", "My work", "Cards" and "Modal" view
	clockifyButton.render(selectors.hanger, { observe: true }, async elem => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton')) return;

		const { hasBoardNameColon, beforeColon, afterColon, boardName } = getBoardName(selectors);

		const description = () =>
			text(selectors.descriptionFromKanbanAndMyWork) ||
			text(selectors.descriptionFromCard, elem) ||
			text(selectors.descriptionFromModal);
		const projectName = hasBoardNameColon ? beforeColon : boardName;
		const taskName = hasBoardNameColon ? afterColon : '';

		const properties = { description, projectName, taskName };

		const link = clockifyButton.createButton(properties);
		const input = clockifyButton.createInput(properties);

		const container = createTag('div', 'clockify-widget-container');

		container.style.position = 'absolute';
		container.style.top = getContainerPosition('top');
		container.style.right = getContainerPosition('right');
		container.style.display = 'flex';
		container.style.alignItems = 'center';
		link.style.marginRight = '10px';

		container.append(link);
		container.append(input);

		elem.prepend(container);
	});

	// "Main table"
	clockifyButton.render(
		'.item-page-header-details-wrapper__top:not(.clockify)',
		// '.monday-board-subsets-tabs:not(.pulse_container *):not(.clockify)',
		{ observe: true, onNavigationRerender: true },
		elem => {
			const { hasBoardNameColon, beforeColon, afterColon, boardName } =
				getBoardName(selectors);

			const description =
				text(selectors.descriptionFromMainTable) || text(selectors.descriptionFromModal);
			const projectName = hasBoardNameColon ? beforeColon : boardName;
			const taskName = hasBoardNameColon ? afterColon : '';

			const entry = { description, projectName, taskName };
			const link = clockifyButton.createButton(entry);
			const input = clockifyButton.createInput(entry);

			const container = createTag('div', 'clockify-widget-container');

			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.style.gap = '10px';
			container.style.marginLeft = '8px';

			container.append(link);
			container.append(input);

			elem.insertAdjacentElement('afterend', container);
		}
	);

	function getContainerPosition(edge) {
		const { kanban, card, modal, myWork, mainTable } =
			selectors.selectorsForViewSpecificElements;

		const views = [
			{ isCurrentView: $(kanban), top: '14px', right: '50px' },
			{ isCurrentView: $(card), top: '10px', right: '90px' },
			{ isCurrentView: $(modal), top: '23px', right: '50px' },
			{ isCurrentView: $(myWork), top: '10px', right: '50px' },
		];

		const currentView = views.find(({ isCurrentView }) => isCurrentView);

		return currentView[edge];
	}
})();

initializeHtmlObserver();
applyManualInputStyles();

function getBoardName(selectors) {
	const boardName =
		text(selectors.boardName) ||
		text(selectors.boardNameFromMainTable) ||
		text('[data-testid="object-name"]');
	const hasBoardNameColon = boardName?.includes(':');
	const beforeColon = boardName.split(':')[0].trim();
	const afterColon = boardName.split(':').slice(1).join('').trim();

	return { boardName, afterColon, beforeColon, hasBoardNameColon };
}

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
			border: none !important;
			background: #edf1fc !important;
			border: 1px solid #dcdcde !important;
		}
	`;
	const darkStyles = `
		span.clockify-button-inactive {
			color: #fff !important;
		}
		
		input.clockify-input {
			color: #fff !important;
			border: none !important;
			background: #292f4c !important;
		}
	`;

	const nightStyles = `
		span.clockify-button-inactive {
			color: #fff !important;
		}
		
		input.clockify-input {
			color: #fff !important;
			border: none !important;
			background: #212121 !important;
		}
	`;

	let stylesToApply = lightStyles;

	if (document.body.classList.contains('dark-app-theme')) {
		stylesToApply = darkStyles;
	} else if (document.body.classList.contains('black-app-theme')) {
		stylesToApply = nightStyles;
	}

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
