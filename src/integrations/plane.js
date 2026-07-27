// Modal and Opened task
clockifyButton.render(`#title-input:not(.clockify)`, { observe: true }, modal => {
	applyManualInputStyles();
	
	const id =
		text(
			'div.flex.items-center.justify-between.gap-2.min-h-7 > div:last-child > div:last-child',
			modal.parentElement.parentElement.parentElement
		) ||
		text(
			'div.flex.items-center.justify-between.gap-4.h-6 > div:first-child > div:last-child',
			modal.parentElement.parentElement.parentElement
		);
	const taskName = () => text('#title-input');
	const description = () => id + ' - ' + taskName();
	const projectName = text(
		'main.bg-surface-1 > div:first-child > div:first-child button.text-11 > button > div:last-child'
	);

	const link = clockifyButton.createButton({ description, projectName, taskName });
	const input = clockifyButton.createInput({ description, projectName, taskName });

	const container = createTag('clockify-widget-container');

	container.style.display = 'flex';
	container.style.alignItems = 'center';
	container.style.gap = '10px';
	container.style.marginLeft = '12px';
	container.style.marginBottom = '5px';

	container.append(link);
	container.append(input);

	modal.parentElement.prepend(container);
});

// List, Board, Calendar, Table, Timeline
clockifyButton.render(
	`a[id*="issue"] > div:first-child > div:first-child:not(.clockify),
	.vertical-scrollbar tr.group > td:first-child > a > div > div:first-child:not(.clockify)`,
	{ observe: true, showTimerOnhover: 'a[id*="issue"]' },
	item => {
		observeItemName(item);

		const id =
			text('div:nth-of-type(2) span', item) || // List layout
			text('span.text-secondary', item.parentElement) || // List layout
			text('div:nth-of-type(1)', item); // Calendar layout
		const taskName = () =>
			text('div:nth-of-type(2) p', item) || // List layout
			text('span.text-primary', item.parentElement) || // List layout
			text('div.text-body-sm-medium', item.parentElement) || // Board layout
			text('div:nth-of-type(2)', item) || // Calendar layout
			text('span.text-13', item.parentElement) || // Timeline layout
			text('div.text-primary', item.parentElement); // Table layout
		const description = id + ' - ' + taskName();
		const projectName = text(
			'main.bg-surface-1 > div:first-child > div:first-child button.text-11 > button > div:last-child'
		);

		const timer = clockifyButton.createSmallButton({
			description,
			projectName,
			taskName: taskName(),
		});

		timer.style.marginLeft = '2px';
		timer.style.marginRight = '3px';

		// In item modal when item has subitems, we need to make more space between timer, expand arrow and the rest
		const subitemModal = $('div:nth-of-type(2)', item.parentElement);

		if (subitemModal?.matches('.truncate.cursor-pointer.items-center')) {
			subitemModal.style.marginLeft = '10px';
		}

		item.prepend(timer);
	}
);

applyStyles(`
	.clockify-input {
		width: 140px
	}
`);

initializeHtmlObserver();
applyManualInputStyles();

function initializeHtmlObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const lightStyles = `
		span.clockify-button-inactive {
			color: #444444 !important;
		}

		input.clockify-input {
			color: #444444 !important;
			border: none !important;
			background: #fff !important;
			border: 1px solid #dcdcde !important;
		}
	`;
	const darkStyles = `
		.clockify-button-inactive {
			color: #FFFFFF8A !important;
			fill: #FFFFFF8A;
		}

		#clockify-manual-input-form input, .clockify-input.clockify-input-default {
			background-color: #1D272C;
			border-color: #1D272C;
			color: #FFFFFF8A;
		}
	`;

	const isThemeDark = document.documentElement.getAttribute('data-theme') === 'dark';
	const stylesToApply = isThemeDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}

function observeItemName(item) {
	const titleObserver = new MutationObserver(clockifyButton.rerenderAllButtons);

	const observationTarget =
		$('div:nth-of-type(2) p', item) || // List layout
		$('span.text-primary', item.parentElement) || // List layout
		$('div.text-body-sm-medium', item.parentElement) || // Board layout
		$('div:nth-of-type(2)', item) || // Calendar layout
		$('span.text-13', item.parentElement) || // Timeline layout
		$('div.text-primary', item.parentElement); // Table layout;

	if (observationTarget) {
		const observationConfig = { subtree: true, characterData: true };
		titleObserver.observe(observationTarget, observationConfig);
	}
}
