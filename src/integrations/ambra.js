(async () => {
	// List view and kanban view
	clockifyButton.render(
		await getSelectors('ambra', 'listAndKanbanView', 'hanger'),
		{ observe: true },
		async elem => {
			await timeout({ milliseconds: 500 });
			if ($('.clockifyButton', elem)) return;

			const selectors = await getSelectors('ambra', 'listAndKanbanView');

			const ambraClockifyButton = $(selectors.ambraClockifyButton, elem);
			const taskCode = () => text(selectors.taskCode, elem);
			const taskDescription = () => text(selectors.taskDescription, elem);

			const linkPlaceholder = createTag('div', 'clockify-button-placeholder');

			const description = () => `${taskCode()} ${taskDescription()}`;
			const projectName = () => text(selectors.projectName);

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			link.style.margin = '0 8px';

			ambraClockifyButton?.replaceWith(linkPlaceholder);

			$('.clockify-button-placeholder', elem)?.appendChild(link);
		}
	);

	// Task modal
	clockifyButton.render(
		await getSelectors('ambra', 'modalView', 'hanger'),
		{ observe: true },
		async elem => {
			const selectors = await getSelectors('ambra', 'modalView');

			const taskCode = () => text(selectors.taskCode, elem);
			const taskDescription = () => text(selectors.taskDescription, elem);
			const taskOptions = $(selectors.taskOptions, elem);

			const description = () => `${taskCode()} ${taskDescription()}`;
			const projectName = () => text(selectors.projectName);

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			link.style.margin = '0 8px';

			taskOptions.prepend(link);
		}
	);
})();

let reorderObserver = null;
waitForElement('.task-description').then(initializeReorderObserver);

window.addEventListener('urlChanged', () => {
	if (reorderObserver) {
		reorderObserver.disconnect();
		reorderObserver = null;
	}

	waitForElement('.task-description').then(initializeReorderObserver);
});

function initializeReorderObserver() {
	reorderObserver = new MutationObserver(async () => {
		await timeout({ milliseconds: 500 });
		clockifyButton.rerenderAllButtons();
	});

	const observationTarget = $('.task-description');
	const observationConfig = {
		childList: true,
		characterData: true,
		subtree: true,
	};

	reorderObserver.observe(observationTarget, observationConfig);
}
