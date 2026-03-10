// Data item modal view
clockifyButton.render(
	'.DetailViewWithActivityFeed > div:first-child > div > div > div:not(.clockify)',
	{ observe: true },
	modal => {
		const description = () => text('.cellContainer textarea');
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
	`.topSidesheet > div:first-child > div:nth-of-type(3):not(.clockify),
			[data-testid=page-element-expansion-stack-renderer-dialog] > div:first-child > div:nth-of-type(3):not(.clockify)`,
	{ observe: true, onNavigationRerender: true },
	modalHeader => {
		const description = () => text('[data-tutorial-selector-id="pageCellLabelPair"] textarea');

		const container = createTag('div', 'clockify-widget-container');
		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		modalHeader.prepend(container);
	}
);

// Interface Project modal view
clockifyButton.render(
	`[data-tutorial-selector-id=interfaceDesignerBuilderIARevampCanvas] > div:first-child > div:nth-of-type(1) > div:first-child:not(.clockify),
		main > div:first-child > div:first-child + div:not(.clockify)`,
	{ observe: true },
	modalHeader => {
		const description = () => text('[data-tutorial-selector-id=pageCellLabelPair]');

		const container = createTag('div', 'clockify-widget-container');
		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.append(link);
		container.append(input);

		container.style.position = 'absolute';
		container.style.right = '50px';

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
