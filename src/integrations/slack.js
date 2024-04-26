// Message actions bar
clockifyButton.render(
	'.c-message_actions__group:not(.clockify)',
	{ observe: true },
	(messageActions) => {
		const message = messageActions.closest('[aria-roledescription="message"]');
		const lastActionIcon = Array.from(messageActions.children).reverse()[0];

		const handledMessage = handleEmojisAndNewLines(message);

		const description = () =>
			$('.c-message_kit__blocks', handledMessage).innerText;

		if (!description()) return;

		const link = clockifyButton.createButton({ description, small: true });

		link.classList.add(
			'c-button-unstyled',
			'c-icon_button',
			'c-icon_button--size_small',
			'c-message_actions__button',
			'c-icon_button--default'
		);

		lastActionIcon.before(link);
	}
);

// Message context menu
clockifyButton.render(
	'.c-popover .c-menu__items:not(.clockify)',
	{ observe: true },
	(contextMenu) => {
		const isSubmenu = contextMenu.closest('.c-submenu');

		if (isSubmenu) return;

		const message = $('.c-message_actions__group').closest(
			'[aria-roledescription="message"]'
		);

		const handledMessage = handleEmojisAndNewLines(message);

		const description = () =>
			$('.c-message_kit__blocks', handledMessage).innerText;

		if (!description()) return;

		const link = clockifyButton.createButton({ description });

		link.classList.add('c-menu_item__li');
		link.style.padding = '0 24px';
		link.style.display = 'block';

		const contextMenuSeparator = createContextMenuSeparator();

		contextMenu.append(contextMenuSeparator);
		contextMenu.append(link);

		// Highlight menu item effect
		link.addEventListener('mouseover', () => {
			const highlightedItems = Array.from(
				$$('.c-menu_item__button--highlighted', contextMenu)
			);
			highlightedItems.forEach((highlightedItem) => {
				highlightedItem.classList.remove('c-menu_item__button--highlighted');
				highlightedItem.parentElement.classList.remove(
					'c-menu_item__li--highlighted'
				);
			});
		});
	}
);

applyStyles(`
	.c-popover .c-menu__items .c-menu_item__li:hover span.clockify-button-inactive {
		color: #fff !important;
	}

	.c-popover .c-menu__items .c-menu_item__li:hover {
		background-color: #1164A3;
	}
`);

function isEmoji(charcode) {
	try {
		String.fromCodePoint(parseInt(charcode, 16));
		return true;
	} catch {
		return false;
	}
}

function handleEmojisAndNewLines(message) {
	const isMessageAlreadyHandled = $('.clockify-ext', message);

	if (isMessageAlreadyHandled) return;

	const messageCopy = message.cloneNode(true);

	const images = Array.from($$('img', messageCopy) || []);
	const breakLines = Array.from($$('.c-mrkdwn__br, br', messageCopy) || []);
	const listItems = Array.from($$('li, pre', messageCopy) || []);

	breakLines.forEach((breakLine) => breakLine.replaceWith('\n'));
	listItems.forEach((listItem) => listItem.after('\n'));

	images.forEach((image) => {
		const emojiCharcode = image.src.split('/').reverse()[0].split('.')[0];

		if (!isEmoji(emojiCharcode)) return;

		const emojiCharacter = String.fromCodePoint(parseInt(emojiCharcode, 16));

		const emoji = createTag('span', 'clockify-ext', emojiCharacter);

		console.log(emoji);

		image.replaceWith(emoji);
	});

	return messageCopy;
}

function createContextMenuSeparator() {
	const container = createTag('div');
	const line = createTag('hr');

	container.classList.add(
		'c-menu_separator__li',
		'c-menu_separator__li--no_first_child',
		'c-menu_separator__li--no_last_child'
	);

	line.classList.add('c-menu_separator__separator');

	container.append(line);

	return container;
}

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.body;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const darkThemeClass = 'theme--dark';
	const isDarkThemeEnabled = Array.from(document.body.classList)
		.join(' ')
		.includes(darkThemeClass);

	const darkStyles = `.clockify-button-inactive { color: #d1d2d3 !important; }`;
	const lightStyles = `.clockify-button-inactive { color: #444444 !important };`;

	const stylesToApply = isDarkThemeEnabled ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
