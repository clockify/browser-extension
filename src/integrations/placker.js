// Card modal view - right side
clockifyButton.render(
	'.dialogOverviewCardContent__right .cardDetails__hiddenAttributes:not(.clockify)',
	{ observe: true },
	taskModalRightSide => {
		const description = () => text('.dialogCardHeaderOverviewComponent__titleInput');
		const projectName = () => text('.breadcrumbComponent__item a');

		const entry = { description, projectName };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);
		const label = createLabel();
		const container = createContainer(label, timer, input);

		handleStyles({ timer, input, container });

		taskModalRightSide.append(container);
	}
);

// Card modal view - checklist items
clockifyButton.render(
	'card-checklist-item-component:not(.clockify)',
	{ observe: true },
	itemList => {
		const checklist = itemList.parentNode.parentNode;
		const checklistTitle = () => checklist.dataset?.checklistTitle;
		const cardTitle = () => checklist.dataset?.cardTitle;
		const itemTitle = () => text('.cardChecklistItemComponent__titleText', itemList);

		const description = () => `${cardTitle()} - ${checklistTitle()} - ${itemTitle()}`;
		const projectName = () => checklist.dataset?.boardTitle;

		const entry = { description, projectName, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.classList.add('plackerButton', 'palckerButton--justTransparent', 'm-l-4');

		const itemActions = $('.cardChecklistItemComponent__contentBottom', itemList);

		itemActions.append(timer);
	}
);

// Board view - cards
clockifyButton.render('card-front-component:not(.clockify)', { observe: true }, boardCard => {
	const description = () => text('.cardTitle', boardCard);

	const entry = { description, small: true };

	const timer = clockifyButton.createTimer(entry);

	timer.classList.add('m-t-8');

	const cardIconsContainer = $('.cardContainer__iconsAndDates', boardCard);

	cardIconsContainer.append(timer);
});

// Gantt view - List - right sidebar
clockifyButton.render(
	'.cardDetails .cardDetails__hiddenAttributes:not(.clockify)',
	{ observe: true },
	listSidebarTopSection => {
		const description = () => listSidebarTopSection.dataset?.cardTitle?.trim();
		const projectName = () => listSidebarTopSection.dataset?.boardTitle?.trim();

		const entry = { description, projectName };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);
		const label = createLabel();
		const container = createContainer(label, timer, input);

		handleStyles({ timer, input, container });

		listSidebarTopSection.append(container);
	}
);

// Gantt view - Item - right sidebar
clockifyButton.render(
	'.checklistItemDetails .cardDetails__hiddenAttributes:not(.clockify)',
	{ observe: true },
	itemSidebarTopSection => {
		const cardTitle = () => itemSidebarTopSection.dataset?.cardTitle?.trim();
		const checklistTitle = () => itemSidebarTopSection.dataset?.checklistTitle?.trim();
		const checklistItemTitle = () => itemSidebarTopSection.dataset?.checklistItemTitle?.trim();

		const description = () => `${cardTitle()} - ${checklistTitle()} - ${checklistItemTitle()}`;
		const projectName = () => itemSidebarTopSection.dataset?.boardTitle?.trim();

		const entry = { description, projectName };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);
		const label = createLabel();
		const container = createContainer(label, timer, input);

		handleStyles({ timer, input, container });

		itemSidebarTopSection.append(container);
	}
);

function createLabel() {
	return createTag('label', 'plackerInput__label', 'Clockify');
}

function handleStyles({ timer, input, container }) {
	const inputChild = input.firstElementChild;

	input.classList += 'm-b-0';
	inputChild.classList = `plackerInput plackerInput--fullWidth plackerInput--transparent plackerInput--condensed clockify-input-default`;
	timer.classList += `plackerButton plackerButton--secondary plackerButton--fullWidth plackerButton--centered m-b-8`;
	timer.style.height = '32px';
	container.style.display = 'flex';
	container.style.width = '100%';
	container.style.flexDirection = 'column';
}
