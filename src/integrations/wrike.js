(async () => {
	clockifyButton.render(
		await getSelectors('wrike', 'taskView', 'hanger'),
		{ observe: true },
		async (elem) => {
			const selectors = await getSelectors('wrike', 'taskView');

			const description = () => $(selectors.description).textContent;

			const projectName = () =>
				$(selectors.projectFromTaskTag, elem)?.textContent ||
				$(selectors.projectFromPageHeader)?.textContent;

			const link = clockifyButton.createButton({ description, projectName });

			link.style.minWidth = '110px';

			elem.prepend(link);
		}
	);
})();
