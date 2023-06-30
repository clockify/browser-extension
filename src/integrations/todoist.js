observeBodyChanges();

// Task List view
clockifyButton.render(
	'[data-action-hint="task-root"]:not(.clockify)',
	{ observe: true },
	(todoistTaskContainer) => {
		const todoistTaskName = $(
			'.task_content',
			todoistTaskContainer
		)?.textContent;
		const todoistTaskDescription = $(
			'.task_description',
			todoistTaskContainer
		)?.textContent;
		const todoistProjectWithSectionName =
			$('.task_list_item__project', todoistTaskContainer)?.textContent ||
			$('header h1')?.textContent;
		const tags = $$('.task_list_item__info_tags__label', todoistTaskContainer);

		const description = todoistTaskDescription ?? todoistTaskName;
		const projectName = projectWithoutSection(todoistProjectWithSectionName);
		const taskName = todoistTaskDescription ? todoistTaskName : '';
		const tagNames = () => Array.from(tags).map((tag) => tag.innerText);

		const link = clockifyButton.createButton({
			description,
			projectName,
			taskName,
			tagNames,
			small: true,
		});

		link.style.paddingRight = '10px';
		link.style.marginTop = '12px';
		link.style.height = 'fit-content';

		todoistTaskContainer.prepend(link);
	}
);

// Task board view
clockifyButton.render(
	'[data-testid="task-card"]:not(.clockify)',
	{ observe: true },
	(todoistTaskCard) => {
		const todoistTaskName = $('.task_content', todoistTaskCard)?.textContent;
		const todoistTaskDescription = $(
			'.task_description',
			todoistTaskCard
		)?.textContent;
		const todoistProjectWithSectionName =
			$('.task_list_item__project', todoistTaskCard)?.textContent ||
			$('header h1')?.textContent;

		const description = todoistTaskDescription ?? todoistTaskName;
		const projectName = projectWithoutSection(todoistProjectWithSectionName);
		const taskName = todoistTaskDescription ? todoistTaskName : '';

		const link = clockifyButton.createButton({
			description,
			projectName,
			taskName,
			small: true,
		});

		todoistTaskCard.style.minHeight = '70px';

		link.style.position = 'absolute';
		link.style.top = '40px';
		link.style.left = '13px';

		todoistTaskCard.append(link);
	}
);

// Task modal view (sidebar part)
clockifyButton.render(
	'[data-testid="modal-overlay"] [role="dialog"]:not(.clockify)',
	{ observe: true },
	(todoistTaskModal) => {
		const todoistTaskModalSidebar = $(
			'[data-testid="task-details-sidebar"]',
			todoistTaskModal
		);

		const todoistTaskName = () =>
			$('.task-overview-content .task_content', todoistTaskModal)?.textContent;
		const todoistTaskDescription = () =>
			$('.task-overview-description .task_content', todoistTaskModal)
				?.textContent;
		const todoistProjectWithSectionName = () =>
			$('button[aria-label="Select a project"] span', todoistTaskModal)
				?.textContent;
		const tags = $$('[data-item-label-name]', todoistTaskModal);

		const description = () => todoistTaskDescription() ?? todoistTaskName();
		const projectName = () =>
			projectWithoutSection(todoistProjectWithSectionName());
		const taskName = () => (todoistTaskDescription() ? todoistTaskName() : '');
		const tagNames = () => Array.from(tags).map((tag) => tag.innerText);

		const container = createTag('div', 'clockify-widget-container');

		const link = clockifyButton.createButton({
			description,
			projectName,
			taskName,
			tagNames,
			small: true,
		});
		const input = clockifyButton.createInput({
			description,
			projectName,
			taskName,
			tagNames,
		});

		container.style.padding = '8px';
		container.style.display = 'flex';
		container.style.alignItems = 'center';

		link.style.marginRight = '20px';

		container.append(link);
		container.append(input);

		todoistTaskModalSidebar.append(container);
	}
);

function projectWithoutSection(projectName) {
	const hasProjectNameValue = !!projectName;
	const hasProjectNameSlash = projectName?.includes('/');

	if (!hasProjectNameValue) return '';

	return !hasProjectNameSlash ? projectName : projectName.split('/')[0];
}

function observeBodyChanges() {
	const bodyObserver = new MutationObserver(bodyChanges);

	bodyObserver.observe(document.body, {
		childList: true,
		subtree: true,
		characterData: true,
	});
}

function bodyChanges() {
	setTimeout(() => {
		const todoistModal = $('[data-testid="modal-overlay"]');
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
	}, 500);
}

function blockPropagation({ elements = [], eventName }) {
	elements.forEach((element) => {
		if (!element) return;

		element.addEventListener(eventName, (event) => event.stopPropagation());
	});
}
