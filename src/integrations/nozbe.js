(async () => {
	clockifyButton.render(
		await getSelectors('nozbe', 'sideTaskView', 'hanger'),
		{ observe: true },
		async (elem) => {
			removeContainers();

			const selectors = await getSelectors('nozbe', 'sideTaskView');

			const leftColumn = $(selectors.leftColumn);
			const rightColumn = $(selectors.rightColumn);

			const linkContainer = createTag('div', selectors.containerClassList);
			const inputContainer = createTag('div', selectors.containerClassList);

			const description = () => $(selectors.description).textContent;

			const link = clockifyButton.createButton({ description });
			const input = clockifyButton.createInput({ description });

			elem.style.height = 'fit-content';
			inputContainer.style.cursor = 'default';
			input.style.cursor = 'text';

			linkContainer.append(link);
			inputContainer.append(input);

			leftColumn.append(linkContainer);
			rightColumn.append(inputContainer);
		}
	);

	function removeContainers() {
		const containers = Array.from($$('.clockify-widget-container'));
		containers.forEach((container) => container.remove());
	}
})();
