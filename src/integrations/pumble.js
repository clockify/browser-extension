// Message options bar
clockifyButton.render(
	'#clockify-extension-small-button-container:not(.clockify)',
	{ observe: true },
	messageOptionsPlaceholder => {
		const message = messageOptionsPlaceholder.closest('.message-item');

		const description = () => getDescriptionFromMessage(message);

		const entry = { description, small: true };

		const timer = clockifyButton.createButton(entry);

		messageOptionsPlaceholder.append(timer);
	}
);

// Both right click & three dots context menus
clockifyButton.render(
	'#clockify-extension-large-button-container:not(.clockify)',
	{ observe: true },
	contextMenuPlaceholder => {
		const message = $('.message-item--highlighted:not(.message-item--pinned)');

		const description = () => getDescriptionFromMessage(message);

		const entry = { description };

		const timer = clockifyButton.createButton(entry);

		contextMenuPlaceholder.append(timer);
	}
);

applyStyles(`
	/* make visible option bar timers of message with text  */
	.message-item:not(:has(.message-item__text--join)) [id^="clockify"][id$="container"] {
		display: block !important;
	}

	/* make visible context menu timers of message with text */
	#root:not(:has(.message-item--highlighted .message-item__text--join)) .context-menu [id^="clockify"][id$="container"] {
		display: block !important;
	}

	/* hide timers from deleted messages */
	.message-item:has([class*="deleted"]) [id^="clockify"][id$="container"] {
		display: none !important;
	}
 	#root:has(.message-item--highlighted [class*="deleted"]) .context-menu [id^="clockify"][id$="container"] {
		display: none !important;
	}

	.message-item:has(.blocks-renderer:empty) [id^="clockify"][id$="container"] {
		display: none !important;
	}

	#root:has(.message-item--highlighted .blocks-renderer:empty) .context-menu [id^="clockify"][id$="container"] {
		display: none !important;
	}

	.clockifyButton svg {
		height: 16px !important;
	}
`);

function getDescriptionFromMessage(message) {
	if (!message) return;

	return getTextContentOfMessage(message) ?? '';
}

function getTextContentOfMessage(message) {
	const messageText = message.querySelector('.rich-text-block');

	if (!messageText) return;

	const messageTextClone = messageText.cloneNode(true);

	messageTextClone.style.display = 'none';

	messageTextClone.querySelectorAll('img[data-image]').forEach(image => {
		const dataImageAttribute = image.getAttribute('data-image');
		const isEmoji = dataImageAttribute && dataImageAttribute.length < 10;

		if (!isEmoji) return;

		const emojiCodepoint = image.getAttribute('data-image').replace('.png', '');
		const emojiCharacter = String.fromCodePoint(parseInt(emojiCodepoint, 16));

		const emoji = createTag('span', 'clockify-extension', emojiCharacter);

		image.replaceWith(emoji);
	});

	messageTextClone.querySelectorAll('br').forEach(element => element.replaceWith('\n'));

	messageTextClone.querySelectorAll('li').forEach(element => element.prepend('\n'));

	return messageTextClone.innerText.trim();
}

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const htmlClasses = document.documentElement.classList.toString();

	let isLightThemeEnabled;

	if (htmlClasses.includes('light')) {
		isLightThemeEnabled = true;
	} else if (htmlClasses.includes('dark')) {
		isLightThemeEnabled = false;
	} else {
		isLightThemeEnabled = window.matchMedia('(prefers-color-scheme: light)').matches;
	}

	const darkStyles = `.clockify-button-inactive { color: #f5f4f3 !important; }`;
	const lightStyles = `.clockify-button-inactive { color: #444444 !important };`;

	const stylesToApply = isLightThemeEnabled ? lightStyles : darkStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
