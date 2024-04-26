(async () => {
	// List view and kanban view
	clockifyButton.render(
		await getSelectors('ambra', 'listAndKanbanView', 'hanger'),
		{ observe: true },
		async (elem) => {
			const selectors = await getSelectors('ambra', 'listAndKanbanView');

			const ambraClockifyButton = $(selectors.ambraClockifyButton, elem);
			const taskCode = $(selectors.taskCode, elem).textContent;
			const taskDescription = $(selectors.taskDescription, elem).textContent;

			const linkPlaceholder = createTag('div', 'clockify-button-placeholder');

			const description = `${taskCode} ${taskDescription}`;
			const projectName = $(selectors.projectName).textContent;

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			link.style.margin = '0 8px';

			ambraClockifyButton?.replaceWith(linkPlaceholder);

			$('.clockify-button-placeholder', elem)?.after(link);
		}
	);

	// Task modal
	clockifyButton.render(
		await getSelectors('ambra', 'modalView', 'hanger'),
		{ observe: true },
		async (elem) => {
			const selectors = await getSelectors('ambra', 'modalView');

			const taskCode = $(selectors.taskCode, elem).textContent;
			const taskDescription = $(selectors.taskDescription, elem).textContent;
			const taskOptions = $(selectors.taskOptions, elem);

			const description = `${taskCode} ${taskDescription}`;
			const projectName = $(selectors.projectName).textContent;

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
