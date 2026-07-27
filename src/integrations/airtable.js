// Data item modal view
clockifyButton.render(
	'.DetailViewWithActivityFeed > div:first-child > div > div > div:not(.clockify)',
	{ observe: true },
	modal => {
		const description = () => text('.cellContainer textarea') || text('.cellContainer [data-testid=cell-editor]');
		const actionButton = $('[class*="link-unquiet pointer"]', modal);

		const container = createTag('div', 'clockify-widget-container');

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		actionButton.insertAdjacentElement('beforebegin', container);
	}
);

// Interface Item modal view
clockifyButton.render(
	`.topSidesheet > div.items-center > div:last-child:not(.clockify),
		[data-testid=page-element-expansion-stack-renderer-dialog] > div:nth-of-type(1) > div.items-center:not(.clockify)`,
	{ observe: true, onNavigationRerender: true },
	async modalHeader => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', modalHeader)) return;

		const description = () => text('[data-tutorial-selector-id="pageCellLabelPair"] textarea') || text('[data-tutorial-selector-id="pageCellLabelPair"]') || text('[data-testid="form-container-page-element-canvas"] h2') || text('[data-testid="form-container-page-element-canvas"] h1') || text('[data-testid="page-element-expansion-stack-renderer-dialog"] > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(2)');

		const container = createTag('div', 'clockify-widget-container');
		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		modalHeader.prepend(container);
	}
);

// Forms modal view
clockifyButton.render(
	`body:not(:has([data-testid="page-element-expansion-stack-renderer-dialog"])) [data-testid="page-element:formContainer"] form > div:first-child:not(.clockify),
	 [data-tutorial-selector-id="interfaceDesignerBuilderIARevampCanvas"] [data-testid="page-element:verticalStack"] > div:first-child > div:first-child > div:not(.clockify)`,
	{ observe: true },
	modalHeader => {
		const description = () => text('[data-testid="form-container-page-element-canvas"] [aria-label="Select element"]') || text('[data-testid="form-container-page-element-canvas"] > div:first-child > div > div') || text('[data-elementtype="verticalStack"] [aria-label="Select element"]');

		const container = createTag('div', 'clockify-widget-container');
		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		container.style.position = 'absolute';
		container.style.right = '50px';
		container.style.top = '10px';

		modalHeader.append(container);
	}
);

// Interface Project modal view
clockifyButton.render(
	`[id="interfaces"] [data-tutorial-selector-id="interfaceDesignerBuilderIARevampCanvas"] > div > div > div:first-child:not(.clockify),
	[aria-label="Page canvas (collaborator mode)"] [id="mainContent"] > div:first-child:not(.clockify)`,
	{ observe: true },
	async modalHeader => {
		const description = () => text('[data-testid="stackedLabel"]');

		const container = createTag('div', 'clockify-widget-container');
		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		container.style.marginLeft = 'auto';
		container.style.marginRight = '20px';

		modalHeader.append(container);
	}
);

// Interface List modal view
clockifyButton.render(
	`[data-elementtype="inbox"] [data-testid="page-element:recordContainerGrid"] > div:first-child:not(.clockify)`,
	{ observe: true, onNavigationRerender: true },
	async modalHeader => {
		await timeout({ milliseconds: 500 });
		const description = () => text('[data-testid="stackedLabel"]');

		const container = createTag('div', 'clockify-widget-container');
		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		container.style.marginLeft = 'auto';

		modalHeader.append(container);
	}
);

applyStyles(`
	.clockify-widget-container {
		min-width: 240px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
`);
