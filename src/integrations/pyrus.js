clockifyButton.observeDarkMode(() => {
	return document.body?.dataset?.theme === 'dark';
});

clockifyButton.render(
	'.sideBySideHeader:not(.clockify)',
	{ observe: true },
	(itemHeader) => {
		const titleSelector = '.sideBySideHeader__title';
		const tagsSelector = '.badgeList__item';

		const itemTitle = () => text(titleSelector, itemHeader);
		const itemId = () => {
			let hash = document.location.hash;
			const regex = /(\d+)$/;

			if (hash.startsWith('#id') || hash.startsWith('#list')) {
				const match = hash.match(regex);

				if (match && match[0]) {
					return match[0];
				}
			}
		}

		const description = () => createDescription({ itemId, itemTitle });
		const projectName = () => {
			let title = itemTitle();

			const regex = /\[(.*?)\]/;
			const match = title.match(regex);

			if (match && match[1]) {
				return match[1];
			}

			return null;
		}

		const taskName = () => itemTitle();
		const tagNames = () => textList(tagsSelector, itemHeader);

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);

		const container = createTag('div', 'clockify-widget-container');

		container.append(link);

		$('.sideBySideHeader__bottom', itemHeader).append(container);
	}
);

function createDescription({ itemId, itemTitle }) {
	if (!itemId()) return itemTitle();

	return `${itemTitle()} (#${itemId()})`;
}

applyStyles(`
	.clockify-widget-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 15px;
		padding: 5px 0;
	}
`);
