(async () => {
	const selectors = await getSelectors('monday', 'allViews');

	// "Main table", "Kanban", "My work", "Cards" and "Modal" view
	clockifyButton.render(selectors.hanger, { observe: true }, (elem) => {
		const boardName =
			text(selectors.boardName) ||
			text(selectors.boardNameFromMainTable) ||
			text('[data-testid="object-name"]');
		const hasBoardNameColon = boardName?.includes(':');
		const beforeColon = boardName.split(':')[0].trim();
		const afterColon = boardName.split(':').slice(1).join('').trim();

		const description = () =>
			text(selectors.descriptionFromKanbanAndMyWork) ||
			text(selectors.descriptionFromMainTable) ||
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

	function getContainerPosition(edge) {
		const { kanban, card, modal, myWork, mainTable } =
			selectors.selectorsForViewSpecificElements;

		const views = [
			{ isCurrentView: $(kanban), top: '14px', right: '50px' },
			{ isCurrentView: $(card), top: '10px', right: '90px' },
			{ isCurrentView: $(modal), top: '23px', right: '50px' },
			{ isCurrentView: $(myWork), top: '10px', right: '50px' },
			{ isCurrentView: $(mainTable), top: '10px', right: '5px' },
		];

		const currentView = views.find(({ isCurrentView }) => isCurrentView);

		return currentView[edge];
	}
})();
