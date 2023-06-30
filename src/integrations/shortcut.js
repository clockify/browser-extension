(async () => {
	clockifyButton.render(
		await getSelectors('shortcut', 'storyModal', 'hanger'),
		{ observe: true },
		async (elem) => {
			const selectors = await getSelectors('shortcut', 'storyModal');

			const stateAttribute = $(selectors.stateAttribute, elem);
			const container = createTag('div', 'attribute editable-attribute');

			const description = () => $(selectors.description, elem).textContent;

			const link = clockifyButton.createButton({ description });

			container.appendChild(link);

			stateAttribute.after(container);
		}
	);
})();
