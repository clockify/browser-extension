// Item modal view
clockifyButton.render(
	'[aria-label="Detail view dialog"] .z2:not(.clockify)',
	{ observe: true },
	modal => {
		const modalHeaderSelector = '[data-tutorial-selector-id="detailViewCloseButton"]';
		const modalHeader = $(modalHeaderSelector, modal).parentElement;

		const description = () => text('.cellContainer textarea');

		const container = createTag('div', 'clockify-widget-container');

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.style.left = '200px';

		container.append(link);
		container.append(input);

		modalHeader.append(container);
	}
);

// Interface views (List, Gallery, Kanban and Grid) both Sidesheet and Fullscreen
clockifyButton.render(
	`[aria-label="Page canvas (creator mode)"] [role="dialog"]:not(.clockify),
	 [aria-label="Page canvas (creator mode)"] nav + div > div:not(.clockify)`,
	{ observe: true },
	elem => {
		const itemTitleSelector = '[data-testid="cell-editor"]';

		const item = elem.closest('[aria-label="Page canvas (creator mode)"]');

		if (!$(itemTitleSelector, item)) return;

		const description = () => text(itemTitleSelector, item);

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		const container = createTag('div', 'clockify-widget-container');

		container.style.right = '100px';

		container.append(link);
		container.append(input);

		elem.append(container);
	}
);

applyStyles(`
	.clockify-widget-container {
		position: absolute;
		top: 10px;
		width: 240px;
		display: flex;
		alignItems: center;
		justify-content: space-between;
	}
`);
