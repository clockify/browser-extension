(async () => {
	const selectors = await getSelectors('scoro');

	// Task list
	clockifyButton.render(selectors.taskListView.hanger, { observe: true }, async taskRow => {
		const description = () => text(selectors.taskListView.taskName, taskRow);

		const timer = clockifyButton.createTimer({ description, small: true });

		timer.dataset.title = description();

		const taskRowHeightPx = parseInt(getCssValue(taskRow, 'height').slice(0, -2));
		const timerHeightPx = 16;
		const timerVerticalMargin = `${(taskRowHeightPx - timerHeightPx) / 2}px`;
		const timerRightMargin = window.location.href.includes('/tasks/') ? '0' : '15px';

		timer.style.margin = `${timerVerticalMargin} ${timerRightMargin} ${timerVerticalMargin} 5px`;

		taskRow.append(timer);
	});

	// Single task
	clockifyButton.render(selectors.singleTaskView.hanger, { observe: true }, async actions => {
		const description = () => text(selectors.singleTaskView.taskTitle);

		const timer = clockifyButton.createTimer({ description });

		timer.style.whiteSpace = 'nowrap';
		timer.style.paddingBottom = '3px';

		actions.prepend(timer);
	});
})();
