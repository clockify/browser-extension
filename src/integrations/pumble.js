// Message options bar
clockifyButton.render(
	'.message-options:not(.clockify)',
	{ observe: true },
	(messageOptions) => {
		const message = messageOptions.closest('.message-item');

		if (isMessageSystemMessage(message)) return;

		const lastOption = $('button:last-child', messageOptions);

		const description = () => getDescriptionFromMessage(message);

		if (!description) return;

		const link = clockifyButton.createButton({ description, small: true });

		link.classList.add('message-options__button');

		lastOption.before(link);
	}
);

// Message context menu
clockifyButton.render(
	'.context-menu:not(.clockify)',
	{ observe: true },
	async (contextMenu) => {
		const messages = Array.from($$('.message-item'));
		const message = messages.find(({ classList }) =>
			classList.contains('message-item--optionsOpen')
		);

		if (isMessageSystemMessage(message)) return;

		if (!message) return;

		const contextMenuSeparator = createTag('div', 'context-menu-separator');

		const description = () => getDescriptionFromMessage(message);

		const link = clockifyButton.createButton({ description });

		link.style.display = 'block';
		link.classList.add('context-menu-item', 'context-menu-item--selectable');

		contextMenu.append(contextMenuSeparator);
		contextMenu.append(link);

		await timeout({ milliseconds: 1000 });

		const isContextMenuVisible = isElementInViewport(contextMenu);

		if (!isContextMenuVisible) {
			moveElementUp(contextMenu, 35);
		}
	}
);

function moveElementUp(element, pixels) {
	const top = element.getBoundingClientRect().top;
	element.style.top = `${top - pixels}px`;
}

function isElementInViewport(element) {
	var rect = element.getBoundingClientRect();

	return (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <=
			(window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

function isMessageSystemMessage(message) {
	return !!text('.join-left-message', message);
}

function getDescriptionFromMessage(message) {
	const textMessageSelector = '.message-item__text div > *';
	const callMessageSelector = '.message-call-attachment';

	handleEmojis(message);

	const messageWrapper = $('.message-item__text > div', message)?.parentElement;

	if ($(textMessageSelector, message)) return messageWrapper?.innerText?.trim();

	if ($(callMessageSelector, message)) {
		const callParticipantsSelector = '.call-participants__img-others-wrapper';
		const callParticipantsElement = $(callParticipantsSelector, message);
		const callParticipants = callParticipantsElement.getAttribute('aria-label');

		return `Call: ${callParticipants}`;
	}
}

function handleEmojis(message) {
	if ($('.clockify-extension', message)) return;

	const messageWrapper = $(
		'.message-item__text div > *',
		message
	)?.parentElement;

	if (!messageWrapper) return;

	const messageImages = Array.from($$('div > img', messageWrapper) || []);

	messageImages.forEach((image) => {
		const dataImageAttribute = image.getAttribute('data-image');
		const isEmoji = dataImageAttribute && dataImageAttribute.length < 10;

		if (!isEmoji) return;

		const emojiCodepoint = image.getAttribute('data-image').replace('.png', '');
		const emojiCharacter = String.fromCodePoint(parseInt(emojiCodepoint, 16));

		const emoji = createTag('span', 'clockify-extension', emojiCharacter);

		emoji.style.display = 'inline-block';
		emoji.style.height = '0';
		emoji.style.width = '0';
		emoji.style.overflow = 'hidden';

		image.after(emoji);
	});
}

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.body;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const backgroundColor = document.body
		.getAttribute('style')
		.split('; ')
		.find((style) => style.startsWith('--background'))
		.split(': ')[1];

	const isLightThemeEnabled = backgroundColor === '#ffffff';

	const darkStyles = `.clockify-button-inactive { color: #f5f4f3 !important; }`;
	const lightStyles = `.clockify-button-inactive { color: #444444 !important };`;

	const stylesToApply = isLightThemeEnabled ? lightStyles : darkStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
