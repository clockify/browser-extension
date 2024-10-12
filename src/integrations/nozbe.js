(async () => {
	// app.nozbe.com
	clockifyButton.render('#details-container', { observe: true }, taskContainer => {
		if ($('.clockify-widget-container', taskContainer)) return;

		const leftColumn = $('.details__attributes-left');
		const rightColumn = $('.details__attributes-right');

		const linkContainerClasses = `details__attribute details__attribute--undefined clockify-widget-container`;
		const inputContainerClasses = `details__attribute details__attribute--undefined clockify-widget-container`;

		const linkContainer = createTag('div', linkContainerClasses);
		const inputContainer = createTag('div', inputContainerClasses);

		const description = () => text('.details__title-name');

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		linkContainer.append(link);
		inputContainer.append(input);

		applyStyles(`
				input.clockify-input { background-color: inherit !important; border: none !important; width: fit-content;}
				.clockify-widget-container { margin-top: 3px !important; height: 37px; }
			`);

		leftColumn.append(linkContainer);
		rightColumn.append(inputContainer);
	});

	// nozbe.app
	clockifyButton.render(
		await getSelectors('nozbe', 'sideTaskView', 'hanger'),
		{ observe: true, onNavigationRerender: true },
		async elem => {
			const selectors = await getSelectors('nozbe', 'sideTaskView');

			const leftColumn = $(selectors.leftColumn);
			const rightColumn = $(selectors.rightColumn);

			const linkContainer = createTag('div', selectors.containerClassList);
			const inputContainer = createTag('div', selectors.containerClassList);

			const description = () => text(selectors.description);

			const link = clockifyButton.createButton({ description });
			const input = clockifyButton.createInput({ description });

			elem.style.height = 'fit-content';
			inputContainer.style.cursor = 'default';
			input.style.cursor = 'text';

			linkContainer.append(link);
			inputContainer.append(input);

			leftColumn.append(linkContainer);
			rightColumn.append(inputContainer);

			const line = await waitForElement(selectors.line, elem);
			line.style.marginTop = '20px';
		}
	);
})();
