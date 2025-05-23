(async () => {
	const selectors = await getSelectors('microsoftPlanner');

	const { gridView, boardView, modalView } = selectors;

	// Grid view
	clockifyButton.render(
		gridView.anchor,
		{ observe: true, showTimerOnhover: '.taskGridContainer .grid-row' },
		taskRow => {
			const description = () => text(gridView.taskRowName, taskRow);
			const projectName = () => text(gridView.projectName, taskRow) || textList(gridView.projectNameFromBreadcrumbs)[1];
			const tagNames = () => textList(gridView.taskRowTags, taskRow);

			const entry = { description, projectName, tagNames, small: true };

			const timer = clockifyButton.createTimer(entry);

			timer.style.position = 'absolute';
			timer.style.marginLeft = '-10px';
			timer.style.zIndex = '100';

			taskRow.prepend(timer);
		},
	);

	// Board view
	clockifyButton.render(boardView.anchor, { observe: true }, taskCard => {
		const description = () => text(boardView.cardTaskName, taskCard);
		const projectName = () => text(boardView.projectName, taskCard) || textList(boardView.projectNameFromBreadcrumbs)[1];
		const tagNames = () => textList(boardView.cardTaskTags, taskCard);

		const entry = { description, projectName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		const bottomSection = $(boardView.cardBottomSection, taskCard);

		bottomSection.after(timer);
	});

	// Modal view
	clockifyButton.render(modalView.anchor, { observe: true }, taskModal => {
		const description = () => value(modalView.taskNameInput, taskModal);
		const projectName = () => text(modalView.cardHeaderTitle, taskModal);
		const tagNames = () => textList(modalView.cardTaskTags, taskModal);

		const entry = { description, projectName, tagNames };

		const timer = clockifyButton.createTimer(entry);

		timer.style.width = '110px';

		const taksNameInput = $(modalView.taskTitleContainer, taskModal);

		taksNameInput.after(timer);
	});
})();

applyDarkModeStyles();

function applyDarkModeStyles() {
	const isDarkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;

	if (!isDarkModeEnabled) return;

	applyStyles(`
		.taskEditor-dialog-content .clockifyButton * { 
			color: white !important;
			background: #292827 !important; 
		}
	`);
}
