// Kanban board (both task modal and side task view)
clockifyButton.render(
	'[class*="headerColumn"]:last-child:not(.clockify)',
	{ observe: true },
	(headerColumn) => {
		const description = () => text('[class*="titleEditor"] p');
		const projectName = () => text('[class*="boardTitle"] div');
		const tagNames = () => textList('[class*="tags-"] [class*="tag-"]');

		const entry = { description, projectName, tagNames, small: true };

		const link = clockifyButton.createButton(entry);

		link.classList.add(
			'icon-2wC6a',
			'icon_toolbar-3wbJo',
			'icon_default-3suvw'
		);

		headerColumn.prepend(link);
	}
);
