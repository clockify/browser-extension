function addCustomCSS() {
	if ($('.clockify-custom-css')) return;
	const style = createTag('style', 'clockify-custom-css');
	style.innerHTML = `
		.clockify-container {
			display: flex;
			align-items: center;
			justify-content: end;
		}
		[data-cy="ConversationHeader.Actions"] .clockify-container {
			margin-right: 8px;
		}
	`;
	document.head.append(style);
}

function getTicketNumber() {
	return (
		text('[data-testid="conversation-info"] [data-testid="CopyValue"] [data-cy="Text"]') ||
		text('[data-testid="conversation-info"] [data-cy="Text"]') ||
		(document.title.match(/^#\d+/) || [''])[0]
	);
}

function getTicketSubject() {
	return (
		text('h1[aria-label="Conversation Subject"]') ||
		document.querySelector('textarea[name="ticket-subject"]')?.value?.trim() ||
		text('#subjectLine')
	);
}

function getHelpScoutDescription() {
	return [getTicketNumber(), getTicketSubject()].filter(Boolean).join(' - ');
}

function getHelpScoutTags() {
	return textList(
		'[data-testid="conversation-header"] [data-cy="Tag"], [data-testid="conversation-info"] [data-cy="Tag"]'
	);
}

function observeTicketName() {
	const subject = document.querySelector('h1[aria-label="Conversation Subject"]');
	if (!subject || subject.dataset.clockifyObserved) return;
	subject.dataset.clockifyObserved = '1';
	new MutationObserver(clockifyButton.rerenderAllButtons).observe(subject, {
		subtree: true,
		characterData: true,
		childList: true,
	});
}

// New UI (2026): header actions (snooze / tag / workflows / more)
clockifyButton.render(
	'[data-cy="ConversationHeader.Actions"]:not(.clockify)',
	{ observe: true },
	async (actions) => {
		observeTicketName();
		addCustomCSS();

		const options = {
			description: getHelpScoutDescription(),
			tagNames: getHelpScoutTags,
		};
		const container = createTag('div', 'clockify-container');
		container.append(clockifyButton.createButton(options));

		// inner flex row holding the icon buttons
		(actions.firstElementChild || actions).prepend(container);
	}
);

// Legacy UI
clockifyButton.render('.actions__wrapper:not(.clockify)', { observe: true }, async (elem) => {
	observeTicketName();
	addCustomCSS();

	const options = {
		description: getHelpScoutDescription(),
		tagNames: () => textList('.tag'),
	};
	const button = clockifyButton.createButton(options);
	const input = clockifyButton.createInput(options);
	button.style.marginRight = '15px';

	const container = createTag('div', 'clockify-container');
	container.append(button);
	container.append(input);
	elem.insertBefore(container, elem.children[1]);
});
