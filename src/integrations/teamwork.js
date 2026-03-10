// Task list view - actions bar
clockifyButton.render(
	'[data-identifier="task-list-item"]:not(.clockify)',
	{ observe: true },
	async taskRow => {
		await timeout({ milliseconds: 500 });
		const actionsBar = $('[data-identifier="task-list-item-action-bar"]', taskRow);
		const tagsContainer = $('[data-identifier="task-list-item-inline-elements-tags"]', taskRow);

		const description = () => text('[class*="group/taskName"]', taskRow);
		const projectName = () => text('.tw-toolbar-title > span');
		const tagNames = () => textList('[class*="group/LscChip"]', tagsContainer);

		const entry = { description, projectName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		// On hover background effect
		timer.style.padding = '4px';
		timer.style.borderRadius = '50%';
		timer.classList.add('hover:bg-[--lsds-c-button-color-bg-tertiary-hover]');

		const threeDotsIcon = $('button:last-of-type', actionsBar);

		threeDotsIcon && !$('[class*="clockify"]', actionsBar) && threeDotsIcon.before(timer);
	}
);

// Task board view - card
clockifyButton.render(
	'[class*="group/card"]:not(.clockify)',
	{
		observe: true,
		observerConfig: { attributes: true },
		showTimerOnhover: '[class*="group/card"]',
	},
	card => {
		const description = () => text('h1,h2,h3,h4', card);
		const projectName = () => text('.tw-toolbar-title > span');
		const tagNames = () =>
			textList('[data-identifier="task-tag-list"] [class*="group/LscChip"]', card);

		const entry = { description, projectName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		// On hover background effect
		timer.style.padding = '4px';
		timer.style.borderRadius = '50%';
		timer.classList.add('hover:bg-[--lsds-c-button-color-bg-tertiary-hover]');

		timer.style.position = 'absolute';
		timer.style.top = '2.8rem';
		timer.style.left = '0.64rem';

		!$('[class*="clockify"]', card) && card.append(timer);
	}
);

// Sidebar view
clockifyButton.render(
	'[data-task-details-section="main"]:not(.clockify)',
	{ observe: true, observerConfig: { attributes: true }, onNavigationRerender: true },
	sidebarDetails => {
		const description = () =>
			text(`a[class*="text-default"]`, sidebarDetails.children[1]) ||
			text(`span[class*="text-default"]`, sidebarDetails.children[1]);
		const projectName = () => text('.tw-toolbar-title > span');
		const tagNames = () =>
			textList('[class*="!hover:text-primary"] [class*="group/LscChip"]', sidebarDetails);

		const entry = { description, projectName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		container.style.display = 'flex';
		container.style.alignItems = 'center';
		container.style.justifyContent = 'space-between';
		container.style.gap = '1rem';
		container.style.width = 'fit-content';
		container.style.margin = '8px 0 0 25px';

		$('input', container).style.padding = '5px';
		$('input', container).style.borderRadius = '5px';

		sidebarDetails.before(container);
	}
);

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
		.clockify-widget-container {
			margin-bottom: 8px !important;
		}

		span.clockify-button-inactive {
			color: #eef1f5 !important;
		}
		input.clockify-input {
			color: #eef1f5 !important;
			border: none !important;
			background: #2b2e2e !important;
		}
	`;

	const htmlTagClasslist = Array.from(document.documentElement.classList);
	const valueWithDark = htmlTagClasslist.find(attributeValue => attributeValue.includes('dark'));
	const isThemeDark = Boolean(valueWithDark);

	const stylesToApply = isThemeDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
