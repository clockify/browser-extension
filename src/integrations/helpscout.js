clockifyButton.render(
	'.Actionscss__ActionsUI-sc-1b08s1m-0:not(.clockify)',
	{ observe: true },
	(actionMenu) => {
		const description = text('[aria-label="Conversation Subject"]');
		const tagNames = () => textList('[data-cy="Tag"]');
		const entry = { description, tagNames, small: true };
		const link = clockifyButton.createButton(entry);

		link.style.padding = '3px';
		link.style.width = '30px';
		actionMenu.prepend(link);
	}
);
