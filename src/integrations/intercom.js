// Inbox
clockifyButton.render(
	'[data-intercom-target="conversation-toolbar"] > div > div > div:nth-of-type(2):not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	elem => {
		const description = text('[data-inbox-conversation-header-title] span');
		const projectName = () => text('span .u__one-truncated-line');

		const link = clockifyButton.createSmallButton({ description, projectName });

		link.style.position = 'relative';
		link.style.left = '10px';

		elem.prepend(link);
	},
);

// Articles
clockifyButton.render(
	'.side-sheet.side-sheet-top-level-render > div > div > div > div:first-child > div:first-child > div:nth-of-type(2):not(.clockify)',
	{ observe: true },
	elem => {
		const description = () => text('.educate__article__editor__title');

		const link = clockifyButton.createSmallButton({ description });

		elem.prepend(link);
	},
);
