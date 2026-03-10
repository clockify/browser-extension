(async () => {
	clockifyButton.render(
		await getSelectors('shortcut', 'storyModal', 'hanger'),
		{ observe: true, onNavigationRerender: true },
		async storyDetails => {
			await timeout({ milliseconds: 750 });
			if ($('#clockifyButton', storyDetails)) return;

			const selectors = await getSelectors('shortcut', 'storyModal');

			const description = () => text(selectors.description, storyDetails);

			const timer = clockifyButton.createButton({ description });

			const container = createTag('div', 'attribute editable-attribute');
			const stateAttribute = await waitForElement(selectors.stateAttribute, storyDetails);

			container.classList.add(
				'jsx-2846176937',
				'dropdown-trigger',
				'kind-sidebar',
				'clockify-widget-container'
			);
			container.style.padding = '10px';

			container.append(timer);
			stateAttribute.after(container);
		}
	);
})();

initializeBodyObserver();
applyManualInputStyles();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true, attributeFilter: ['data-theme'] };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const isDarkMode =
		document.documentElement.attributes.getNamedItem('data-theme').value === 'dark';

	const darkStyles = `.clockify-button-inactive { color: rgba(242,242,248,.87) !important; }`;
	const lightStyles = `.clockify-button-inactive { color: #444 !important };`;

	const stylesToApply = isDarkMode ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
