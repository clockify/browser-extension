// Tasks (list) view and Modal Subtasks (list) view
clockifyButton.render(
	'[data-action-hint="task-root"]:not(.clockify)',
	{ observe: true },
	(todoistTaskContainer) => {
		const todoistTaskName = text('.task_content', todoistTaskContainer);
		const todoistTaskDescription = text(
			'.task_description',
			todoistTaskContainer
		);
		const todoistProjectWithSectionName =
			text(
				'[data-testid="task-details-modal"] button[aria-label="Select a project"] span'
			) ||
			text('.task_list_item__project', todoistTaskContainer) ||
			text('header h1 .simple_content') ||
			text('header h1');

		const description = todoistTaskDescription ?? todoistTaskName;
		const projectName = withoutSection(todoistProjectWithSectionName);
		const taskName = todoistTaskName;
		const tagNames = () =>
			textList('.task_list_item__info_tags__label', todoistTaskContainer);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const link = clockifyButton.createButton(entry);

		link.style.paddingRight = '10px';
		link.style.marginTop = '12px';
		link.style.height = 'fit-content';

		todoistTaskContainer.prepend(link);
	}
);

// Cards (board) view
clockifyButton.render(
	'[data-testid="task-card"]:not(.clockify)',
	{ observe: true },
	(todoistTaskCard) => {
		const todoistTaskName = text('.task_content', todoistTaskCard);
		const todoistTaskDescription = text('.task_description', todoistTaskCard);
		const todoistProjectWithSectionName =
			text('.task_list_item__project', todoistTaskCard) || text('header h1');

		const description = todoistTaskDescription ?? todoistTaskName;
		const projectName = withoutSection(todoistProjectWithSectionName);
		const taskName = todoistTaskName;

		const entry = { description, projectName, taskName, small: true };

		const link = clockifyButton.createButton(entry);

		todoistTaskCard.style.minHeight = '70px';

		link.style.position = 'absolute';
		link.style.top = '40px';
		link.style.left = '13px';

		todoistTaskCard.append(link);
	}
);

// Modal view - Sidebar timer
clockifyButton.render(
	'[data-testid="task-details-modal"]:not(.clockify)',
	{ observe: true },
	(todoistTaskModal) => {
		const todoistTaskName = () =>
			text('.task-overview-content .task_content', todoistTaskModal);
		const todoistTaskDescription = () =>
			text('.task-overview-description .task_content', todoistTaskModal);
		const todoistProjectWithSectionName = () =>
			text('button[aria-label="Select a project"] span', todoistTaskModal);

		const description = () => todoistTaskDescription() ?? todoistTaskName();
		const projectName = () => withoutSection(todoistProjectWithSectionName());
		const taskName = () => todoistTaskName();
		const tagNames = () => textList('[data-item-label-name]', todoistTaskModal);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		link.style.marginRight = '20px';

		const container = createTag('div', 'clockify-widget-container');

		container.style.padding = '2px 8px';
		container.style.width = '190px';
		container.style.display = 'flex';
		container.style.alignItems = 'center';
		container.style.justifyContent = 'space-between';

		container.append(link);
		container.append(input);

		const todoistTaskModalSidebar = $(
			'[data-testid="task-details-sidebar"]',
			todoistTaskModal
		);

		todoistTaskModalSidebar.style.justifyContent = 'start';

		todoistTaskModalSidebar.append(container);
	}
);

/* 
	Todoist has a bucnh of light themes (todoist, tangerine, neutral, ...) and one dark theme (dark).
	Trace of currentely applied theme can be found in <HTML> element's class named theme_*
	where * represents name of theme. 
*/

setManualInputStyles();

async function setManualInputStyles() {
	await timeout({ milliseconds: 300 });

	if (isDarkThemeEnabled()) {
		addDarkManualInputStyles();
	} else {
		removeDarkManualInputStyles();
	}
}

function isDarkThemeEnabled() {
	const themeName = getThemeName();

	return themeName === 'dark';
}

function getThemeName() {
	const htmlElementClassList = Array.from(document.documentElement.classList);

	const themeName = htmlElementClassList
		.find((classListItem) => classListItem.startsWith('theme_'))
		.replace('theme_', '');

	return themeName;
}

function addDarkManualInputStyles() {
	if ($('.clockify-custom-style-dark')) return;

	const darkThemeStyle = `
		.clockify-input {
			background: #1f1f1f !important;
			color: #eee !important;
			border: 1px solid #444 !important;
		}
	`;

	const style = createTag(
		'style',
		'clockify-custom-style-dark',
		darkThemeStyle
	);

	document.head.append(style);
}

function removeDarkManualInputStyles() {
	$('.clockify-custom-style-dark')?.remove();
}

/*
	Todoist helpers
*/

function withoutSection(projectName) {
	const isProjectNameEmpty = !Boolean(projectName);

	if (isProjectNameEmpty) return null;

	const hasProjectNameSection = projectName.includes('/');

	if (hasProjectNameSection) {
		return projectName.split('/')[0];
	}

	return projectName;
}

/* 
	Todoist application listens to focus events on DOM (including extension popup fields) 
	and then handles those events in such way that popup editable elements can't be edited 
	(it occurs only when popup is opened by clicking Start time from Todoist task modal).
	The following functions fix issues caused by those Todoist application event handlers. 
*/

observeBodyChanges();

function observeBodyChanges() {
	const bodyObserver = new MutationObserver(bodyChanges);

	const observationTarget = document.body;
	const observationConfig = { childList: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

async function bodyChanges() {
	await timeout({ milliseconds: 500 });

	const todoistModal = $('[data-testid="task-details-modal"]');
	const clockifyPopup = $('.clockify-integration-popup');

	const todoistModalAndClockifyPopupAreShown = todoistModal && clockifyPopup;

	if (!todoistModalAndClockifyPopupAreShown) return;

	const editableElements = ['textarea', 'input'];

	const taskContent = $('.task-overview-content', todoistModal);
	const manualInput = $('.clockify-input', todoistModal);
	const editablePopupFields = editableElements
		.map((editableElement) => $$(editableElement, clockifyPopup))
		.map((nodeList) => Array.from(nodeList))
		.flat();

	blockPropagation({
		elements: [taskContent, manualInput],
		eventName: 'focusout',
	});
	blockPropagation({
		elements: editablePopupFields,
		eventName: 'focusin',
	});
}

function blockPropagation({ elements = [], eventName }) {
	elements.forEach((element) =>
		element.addEventListener(eventName, (event) => event.stopPropagation())
	);
}
