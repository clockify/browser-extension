// Item modal view
clockifyButton.render(
	'div[role=dialog] .z2 .flex.border-darken2:not(.clockify)',
	{ observe: true },
	(elem) => {
		const cellContainerEl = $('div.detailView .labelCellPair .cellContainer');
		const description = () => {
			const desc =
				$('div[role="textbox"]', cellContainerEl) ||
				$('textarea', cellContainerEl) ||
				$('input', cellContainerEl);

			if (desc) return desc.value || desc.innerText;
		};

		const container = createTag('div', 'clockify-widget-container');

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.style.right = '200px';

		container.append(link);
		container.append(input);

		elem.append(container);
	}
);

// Interface views (List, Gallery, Kanban and Grid) both Sidesheet and Fullscreen
clockifyButton.render(
	`[aria-label="Page canvas (creator mode)"] [role="dialog"]:not(.clockify),
	 [aria-label="Page canvas (creator mode)"] nav + div > div:not(.clockify)`,
	{ observe: true },
	(elem) => {
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
