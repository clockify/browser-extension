clockifyButton.render(
	'.StatusAssigneecss__ContainerUI-sc-2iztpe-0:not(.clockify)',
	{ observe: true },
	(actionMenu) => {
		const description = getHelpScoutDescription();
		const tagNames = () => textList('[data-cy="Tag"]');
		const entry = { description, tagNames };
		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		input.style.marginRight = '15px';
		link.style.marginRight = '15px';

		actionMenu.prepend(input);
		actionMenu.prepend(link);
	}
);

// Helpscout legacy theme
clockifyButton.render(
	'.actions__wrapper:not(.clockify)',
	{ observe: true },
	(actionMenu) => {
		const description = () => getHelpScoutDescription();
		const tagNames = () => textList('.tag');
		const entry = { description, tagNames };
		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		link.style.marginRight = '15px';

		const container = createTag('div', 'clockify-container');
		addCustomCSS();

		container.append(link);
		container.append(input);

		actionMenu.insertBefore(container, actionMenu.children[1]);
	}
);

function addCustomCSS() {
	if ($('.clockify-custom-css')) return;

	const style = createTag('style', 'clockify-custom-css');

	style.innerHTML = `
		.clockify-container {
			display: flex;
			align-items: center;
			justify-content: end;
		}
	`;

	document.head.append(style);
}

function getHelpScoutDescription() {
	const url = (() => {
		try {
			return window.top?.location?.href || location.href;
		} catch {
			return location.href || "";
		}
	})();

	const match = url.match(/(?:conversation|conversations)\/\d+\/(\d+)(?:[/?#]|$)/i);

	const subject = (text('[aria-label="Conversation Subject"]') || "").trim();

	const ticketPrefix = match ? `#${match[1]} - ` : "";

	return ticketPrefix + subject;
}
