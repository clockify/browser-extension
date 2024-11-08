// List - New UI (September 2023.)
clockifyButton.render('.cu-task-row__main:not(.clockify)', { observe: true }, async taskRow => {
	if (clickupVersion() !== 3) return;

	await timeout({ milliseconds: 500 });

	const taskNameSelector = `.cu-task-row-main__link-text-inner`;
	const tagNamesSelector = `.cu-tags-select__name-container > span`;
	const pageBreadcrumbsSelector = `cu-location-header-breadcrumbs cu-breadcrumb-item`;
	const groupBreadcrumbsSelector = `.cu-list-group__header-breadcrumbs`;

	const extract = taskRow => {
		const isGroupedByStatus = (
			text('[data-test="selected_groupBy"]') ??
			text('[data-test="cu2-views-dropdown__groupBy"]')
		).includes('Status');

		if (!isGroupedByStatus) return { folderName: null, listName: null };

		let folderName, listName;

		const listGroup = taskRow.closest('.cu-list-group');

		const pageBreadcrumbs = textList(pageBreadcrumbsSelector);
		const groupBreadcrumbs = text(groupBreadcrumbsSelector, listGroup)?.split('/');

		if (pageBreadcrumbs.length === 3) {
			folderName = pageBreadcrumbs[1];
			listName = pageBreadcrumbs[2];
		} else if (pageBreadcrumbs.length === 2) {
			const isListWithoutFolder = groupBreadcrumbs?.length ? false : true;
			folderName = pageBreadcrumbs[1];
			listName = isListWithoutFolder ? null : groupBreadcrumbs[0];
		} else if (pageBreadcrumbs.length === 1) {
			if (groupBreadcrumbs.length === 3) {
				folderName = groupBreadcrumbs[1];
				listName = groupBreadcrumbs[2];
			} else if (groupBreadcrumbs.length === 2) {
				folderName = groupBreadcrumbs[0];
				listName = groupBreadcrumbs[1];
			} else if (groupBreadcrumbs.length === 1) {
				folderName = groupBreadcrumbs[0];
				listName = null;
			}
		}

		return { folderName, listName };
	};

	const folderName = extract(taskRow).folderName;
	const listName = extract(taskRow).listName;

	const clickUpTaskName = () => text(taskNameSelector, taskRow);
	const taskLink = $('.cu-task-row-main__link', taskRow).href;

	const taskId = taskLink.split('/').pop();

	const description = () => `${clickUpTaskName()} | #${taskId}`;
	const projectName = () => folderName || listName;
	const taskName = () => listName || null;
	const tagNames = () => textList(tagNamesSelector, taskRow);

	const entry = { description, projectName, taskName, tagNames, small: true };

	const link = clockifyButton.createButton(entry);

	link.style.position = 'absolute';
	link.style.left = '15px';
	link.style.zIndex = '9999';

	taskRow.prepend(link);
});

// Card - New UI (March 2023.)
clockifyButton.render(
	'.cu-task-view__container [data-test="task-view-header__breadcrumbs"]:not(.clockify)',
	{ observe: true },
	async cardHeader => {
		await timeout({ milliseconds: 500 });

		$('#clockifyButton', cardHeader)?.remove();

		const card = cardHeader.closest('.cu-task-view__container');

		const headerElements = $$('.cu-task-view-breadcrumbs__text');
		const headerChildren = headerElements.length;
		const hasThreeChildren = headerChildren === 3;
		const folderName = hasThreeChildren ? headerElements[1].textContent : null;
		const listName = hasThreeChildren
			? headerElements[2].textContent
			: headerElements[1].textContent;

		const description = () => document.title;
		const projectName = () => folderName ?? listName;
		const taskName = () => (folderName ? listName : '');
		const tagNames = () => textList('.cu-tags-badge__inner span', card);

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		const container = createTag('div', 'clockify-widget-container');

		container.style.display = 'flex';

		link.style.display = 'inline-flex';
		link.style.paddingLeft = '10px';
		link.style.marginRight = '15px';
		link.style.cursor = 'pointer';

		container.append(link);
		container.append(input);

		cardHeader.append(container);
	}
);

// Card - Old UI
clockifyButton.render(
	'[data-test="task-container"]:not(.clockify)',
	{ observe: true },
	async card => {
		await timeout({ milliseconds: 500 });

		if ($('#clockifyButton', card)) return;

		makeSmallButton();

		const tagSelector = 'div.cu-tags-view__container div.cu-tags-select__name';
		const folderName = text('.breadcrumbs__link_folder', card);
		const listName = text('.breadcrumbs__link_list', card);

		const description = document.title;
		const projectName = folderName ?? listName;
		const taskName = folderName ? listName : '';
		const tagNames = textList(tagSelector, card);

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		const container = createTag('div', 'clockify-widget-container');

		container.style.display = 'flex';
		container.style.alignItems = 'center';
		container.style.justifyContent = 'space-between';
		container.style.width = '250px';
		container.style.marginLeft = '10px';

		container.append(link);
		container.append(input);

		const cardHeader = $('.task-container__header');

		cardHeader.append(container);
	}
);

// List - old UI
clockifyButton.render('.cu-task-row__container:not(.clockify)', { observe: true }, async task => {
	if (clickupVersion() !== 2) return;

	await timeout({ milliseconds: 500 });

	const clickUpTaskName = () => text('.cu-task-row-main__link-text-inner', task);
	const clickUpTaskId = () => task.getAttribute('data-task');

	const description = () => `${clickUpTaskName()} | ${clickUpTaskId()}`;
	const { projectName, taskName } = getProjectAndTask(task);
	const tagNames = () => textList('.cu-tags-select__name', task);

	const entry = { description, projectName, tagNames, taskName, small: true };

	const link = clockifyButton.createButton(entry);

	link.style.position = 'absolute';
	link.style.right = '-15px';
	link.style.top = '8px';
	link.style.zIndex = '99999';

	const taskRow = $('cu-task-row-main', task);

	taskRow.append(link);
});

applyStyles(
	`
	.cu-v3 .cu-task-row__status { padding-left: 5px; }
	.cu-v3 .cu-task-row__open-subtasks { margin-left: -36px !important; }
`,
	'clockify-space-for-small-btn'
);

applyStyles(
	`
	.cu-task-row__container #clockifySmallButton:not(.active) { display: none; }
	.cu-task-row__container:hover #clockifySmallButton { display: inline-flex; }
`,
	'clockify-on-hover-effect'
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

function clickupVersion() {
	return document.documentElement.classList.contains('cu-v2') ? 2 : 3;
}

function makeSmallButton() {
	const interval = setInterval(() => {
		const startTimerText = $(
			'.small.clockifyButton span.clockify-button-inactive.clockify-button-inactive-span'
		);

		if (startTimerText) {
			startTimerText.remove();
			clearInterval(interval);
		}
	}, 100);
}

function getDashboardFolderAndListName(task) {
	const listGroup = task.closest('cu-list-group')?.parentElement;

	const dashboardFolderName = textList(
		'.cu-list-group__category-name.ng-star-inserted',
		listGroup
	);
	const hasDashboardFolderName = dashboardFolderName.length > 1 ? true : false;

	const listName = text('.cu-list-group__name', listGroup);

	return {
		dashboardFolderName: hasDashboardFolderName ? dashboardFolderName[0] : null,
		listName,
	};
}

function getProjectAndTask(task) {
	const groupedBy = text('[data-test="selected_groupBy"]');

	const { dashboardFolderName, listName } = getDashboardFolderAndListName(task);

	const asideBardOpenedFolderName = text(
		'.nav-category__header_opened .nav-category__name-text span'
	);

	// Case 1: Group by criteria isn't set to Status (integration shouldn't pick up neither poject nor task)
	if (groupedBy !== 'Status') return { projectName: '', taskName: '' };

	// Case 2: Folder name is shown up in aside list bar
	if (asideBardOpenedFolderName)
		return {
			projectName: asideBardOpenedFolderName,
			taskName: listName,
		};

	// Case 3: Folder name is shown up in Dashboard table by list groups
	if (dashboardFolderName)
		return {
			projectName: dashboardFolderName,
			taskName: listName,
		};

	// Case 4: List does not exist inside folder (integration should pick up only list name as a project)
	return { projectName: listName, taskName: '' };
}
