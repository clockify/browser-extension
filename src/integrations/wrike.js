(async () => {
	clockifyButton.render(
		await getSelectors('wrike', 'taskView', 'hanger'),
		{ observe: true },
		async elem => {
			const selectors = await getSelectors('wrike', 'taskView');

			const description = () => text(selectors.description);

			const projectName = () =>
				text(selectors.projectFromTaskTag, elem) ||
				text(selectors.projectFromPageHeader) ||
				text(selectors.projectFrom);

			const link = clockifyButton.createButton({ description, projectName });

			link.style.minWidth = '110px';

			elem.prepend(link);
		}
	);
})();
