// Item view
clockifyButton.render(
	'.work-item-form-headerContent:not(.clockify,.flex-row)',
	{ observe: true },
	(itemHeader) => {
		const tagsSelector = `.work-item-view .tags-items-container .tag-item:not(.tags-add-button) .tag-box`;

		const itemId = () => text('.work-item-form-id > span', itemHeader);
		const itemTitle = () => value('.work-item-form-title input', itemHeader);

		const description = () => createDescription({ itemId, itemTitle });
		const projectName =
			value("input[aria-label='Clockify Project']") ||
			text('.navigation-container .project-item .text-ellipsis');
		const taskName = () => itemTitle();
		const tagNames = () => textList(tagsSelector);

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		const container = createTag('div', 'clockify-widget-container');

		// Azure web app handles keydown event in such a way that blocks submitting manual time
		input.addEventListener('keydown', (event) => event.stopPropagation());

		container.append(link);
		container.append(input);

		itemHeader.append(container);
	}
);

// Item board hub view (new UI)
clockifyButton.render(
	'.work-item-form-header:not(.clockify,.flex-row)',
	{ observe: true },
	(itemHeader) => {
		const tagsSelector = `.work-item-tag-picker .bolt-pill-content`;

		const itemId = () => text('.work-item-form-header > .body-xl', itemHeader);
		const itemTitle = () =>
			value('.work-item-title-textfield input', itemHeader);

		const description = () => createDescription({ itemId, itemTitle });
		const projectName = () =>
			value("input[aria-label='Clockify Project']") ||
			text('.navigation-container .project-item .text-ellipsis');
		const taskName = () => itemTitle();
		const tagNames = () => textList(tagsSelector, itemHeader);

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		const container = createTag('div', 'clockify-widget-container');

		container.append(link);
		container.append(input);

		itemHeader.append(container);
	}
);

function createDescription({ itemId, itemTitle }) {
	if (!itemId) return itemTitle();

	return `#${itemId()} ${itemTitle()}`;
}

applyStyles(`
	.clockify-widget-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 15px;
		width: 250px;
		padding: 5px 0;
	}
`);
