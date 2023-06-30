observeThemeChange();
updateColorStyle();

//window
clockifyButton.render(
	'.notion-topbar-action-buttons',
	{ observe: true },
	(elem) => {
		if ($('.clockify-widget-container')) {
			if (!$('#clockifyButton')) $('.clockify-widget-container').remove();
			else return;
		}

		const container = createTag('div', 'clockify-widget-container');

		const description = () =>
			$('.notion-scroller .notranslate[contenteditable=true]')?.textContent;

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.style.margin = '0 10px';
		container.style.display = 'flex';
		container.style.alignItems = 'center';
		link.style.marginRight = '10px';
		$('input', input).style.paddingLeft = '5px';

		container.append(link);
		container.append(input);
		elem.prepend(container);

		blockNotionKeyEvents($('input', input));
	}
);

//task
clockifyButton.render('.notion-peek-renderer', { observe: true }, (elem) => {
	if ($('.clockify-widget-container', elem)) return;

	const modal = $('div:nth-child(2)', elem);
	if (!modal) return;
	const modalHeader = $('div:first-child > div:first-child', modal);
	const firstHeaderElement = $(
		'div > div:first-child > div:first-child',
		modalHeader
	);

	const container = createTag('div', 'clockify-widget-container');

	const description = () =>
		$('.notion-scroller .notranslate[contenteditable=true]', elem)?.textContent;

	const link = clockifyButton.createButton({ description });
	const input = clockifyButton.createInput({ description });

	container.style.margin = '0 20px';
	container.style.alignItems = 'center';
	link.style.marginRight = '10px';
	link.style.position = 'relative';
	link.style.top = '2px';
	$('input', input).style.paddingLeft = '5px';

	container.append(link);
	container.append(input);
	firstHeaderElement.after(container);

	blockNotionKeyEvents($('input', input));
});

function blockNotionKeyEvents(clockifyInput) {
	const eventNames = ['keypress', 'keydown', 'keyup'];
	eventNames.forEach((eventName) =>
		clockifyInput.addEventListener(eventName, (event) =>
			event.stopPropagation()
		)
	);
}

function observeThemeChange() {
	const themeObserver = new MutationObserver(updateColorStyle);

	themeObserver.observe(document.body, { attributes: true });
}

function updateColorStyle() {
	return isThemeDark() ? addDarkThemeStyle() : removeDarkThemeStyle();
}

function isThemeDark() {
	return document.body.classList.contains('dark') ? true : false;
}

function addDarkThemeStyle() {
	if ($('.clockify-custom-style-dark')) return;

	const darkThemeStyle = `
		.clockify-input {
			background: #333 !important;
			border: #444 !important;
			color: #f4f4f4 !important;
		}

		.clockify-button-inactive {
			color: rgba(255, 255, 255, 0.81) !important;
		}
	`;

	const style = createTag(
		'style',
		'clockify-custom-style-dark',
		darkThemeStyle
	);

	document.head.append(style);
}

function removeDarkThemeStyle() {
	$('.clockify-custom-style-dark')?.remove();
}
