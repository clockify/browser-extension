// List - New UI (September 2023.)
clockifyButton.render(
	'.cu-task-row__main:not(.clockify)',
	{
		observe: true,
		showTimerOnhover: '.cu-task-row',
	},
	async taskRow => {
		await timeout({ milliseconds: 500 });

		const taskNameSelector = `.cu-task-row-main__link-text-inner`;
		const tagNamesSelector = `.cu-tags-select__name-container > span`;
		const { projectName, listName } = getListProjectAndTask(taskRow.closest('cu-list-group'));
		const clickUpTaskName = () => text(taskNameSelector, taskRow);
		const taskLink = $('.cu-task-row-main__link', taskRow).href;
		const taskId = taskLink.split('/').pop();

		const description = () => `${clickUpTaskName()} | #${taskId}`;

		const tagNames = () => textList(tagNamesSelector, taskRow);
		const entry = { description, projectName, taskName: listName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.style.position = 'absolute';
		timer.style.left = '15px';
		timer.style.zIndex = '9999';

		taskRow.prepend(timer);
	}
);

// Modal/Sidebar - New UI (March 2023.)
clockifyButton.render(
	'.cu-task-view__container .cu-task-view-header__left:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async sidebarHeader => {
		const pageBreadcrumbs = textList('span[class*="cu-task-view-breadcrumbs"]');
		observeTaskChange();
		const sidebar = sidebarHeader.closest('.cu-task-view__container');

		let projectName = pageBreadcrumbs.length === 3 ? pageBreadcrumbs[1] : pageBreadcrumbs[0];

		const listName = pageBreadcrumbs[pageBreadcrumbs.length - 1];

		const clickupTaskId = () =>
			window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
		const clickupTaskName = () => text('.cu-task-title__overlay');

		const description = () => `${clickupTaskName()} | #${clickupTaskId()}`;
		const tagNames = () => textList('.cu-tags-badge__inner span', sidebar);

		const entry = { description, projectName, taskName: listName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		container.style.display = 'flex';

		timer.style.display = 'inline-flex';
		timer.style.paddingLeft = '10px';
		timer.style.marginRight = '15px';
		timer.style.cursor = 'pointer';

		container.append(timer);
		container.append(input);

		sidebarHeader.append(container);
	}
);

function getListProjectAndTask(context) {
	const pageBreadcrumbs = textList('cu-breadcrumb-item span:not(.avatar-initials)');

	// default values
	const listPath = text('.cu-list-group__header-breadcrumbs', context);
	let projectName = listPath.substring(listPath.indexOf('/') + 1).trim();
	let listName = text('[data-test*="list-group-name"]', context);

	if (pageBreadcrumbs.length === 3) {
		projectName = pageBreadcrumbs[1];
		listName = pageBreadcrumbs[2];
	} else if (pageBreadcrumbs.length === 2) {
		projectName = !listName ? pageBreadcrumbs[0] : pageBreadcrumbs[1];

		if (!listName) {
			listName = pageBreadcrumbs[1];
		}
	}

	return { projectName, listName };
}

applyStyles(
	`
	.cu-v3 .cu-task-row__status { padding-left: 5px; }
	.cu-v3 .cu-task-row__open-subtasks { margin-left: -36px !important; }
`,
	'clockify-space-for-small-btn'
);

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyThemeDependentStyles);

	const observationTarget = document.body;
	const observationConfig = { childList: true, attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

async function applyThemeDependentStyles() {
	const isDarkThemeEnabled = document.body.classList.contains('dark-theme');

	const darkStyles = `
	#clockify-manual-input-form input { background: rgb(42, 46, 52) !important; color: #f5f4f3 !important; border: 0.5px solid rgb(60, 65, 74) !important; }
	.clockify-button-inactive { color: #f5f4f3 !important; }
	.clockify-manual-entry-header-text { color: #333; }
`;
	const lightStyles = `
	.clockify-input { background: white !important; color: rgb(42, 46, 52) !important; border: 1px solid #f7f7f7 !important; }
	.clockify-button-inactive { color: #444444 !important };
`;

	const stylesToApply = isDarkThemeEnabled ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}

function observeTaskChange() {
	const taskObserver = new MutationObserver(() => {
		setTimeout(clockifyButton.rerenderAllButtons, 0);
	});

	const observationTarget = document.querySelector(
		'[data-test="cu-task-view-task-label__task-id"]'
	);

	if (observationTarget) {
		const observationConfig = { childList: true, subtree: true, characterData: true };
		taskObserver.observe(observationTarget, observationConfig);
	}
}
