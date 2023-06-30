(async () => {
	const selectors = await getSelectors('scoro');

	// Task list
	clockifyButton.render(
		selectors.taskListView.hanger,
		{ observe: true },
		async (elem) => {
			const description = $(selectors.taskListView.taskName, elem).textContent;

			const link = clockifyButton.createButton({
				description,
				small: true,
			});

			link.dataset.title = description;

			link.style.marginTop =
				window.location.href.indexOf('tasks') !== -1 ? '10px' : '11px';
			link.style.paddingLeft = '8px';

			elem.appendChild(link);
		}
	);

	// Single task
	clockifyButton.render(
		selectors.singleTaskView.hanger,
		{ observe: true },
		async (elem) => {
			const description = $(
				selectors.singleTaskView.taskTitle
			).textContent.trim();

			const link = clockifyButton.createButton({ description });

			link.style.whiteSpace = 'nowrap';
			link.style.paddingBottom = '3px';

			elem.prepend(link);
		}
	);
})();
