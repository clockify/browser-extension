// Card - New UI (March 2023.)
clockifyButton.render(
	'.cu-task-view__container [data-test="task-view-header__breadcrumbs"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		setTimeout(() => {
			$('#clockifyButton', elem)?.remove();

			const headerElements = $$('.cu-task-view-breadcrumbs__text');
			const headerChildren = headerElements.length;
			const hasThreeChildren = headerChildren === 3;
			const folderName = hasThreeChildren
				? headerElements[1].textContent
				: null;
			const listName = hasThreeChildren
				? headerElements[2].textContent
				: headerElements[1].textContent;

			const description = () => $('.cu-task-title__overlay').textContent;
			const projectName = () => folderName ?? listName;
			const taskName = () => (folderName ? listName : '');
			const tagNames = () =>
				Array.from($$('.cu-tags-badge__inner span')).map(
					(tag) => tag.textContent
				);

			const clockifyProps = { description, projectName, taskName, tagNames };

			const link = clockifyButton.createButton(clockifyProps);
			const input = clockifyButton.createInput(clockifyProps);

			link.style.display = 'inline-flex';
			link.style.paddingLeft = '10px';
			link.style.marginRight = '15px';
			link.style.cursor = 'pointer';

			elem.appendChild(link);
			elem.appendChild(input);
		}, 2000);
	}
);

// Card
clockifyButton.render(
	'.task-container__header:not(.clockify)',
	{ observe: true },
	(elem) => {
		setTimeout(() => {
			if ($('.task-container__header > #clockifyButton')) return; // prevents start timer duplicating

			makeSmallButton();

			const tagSelector =
					'div.cu-tags-view__container div.cu-tags-select__name',
				folderName = $('.breadcrumbs__link_folder')?.textContent,
				listName = $('.breadcrumbs__link_list')?.textContent;

			const description = document.title,
				projectName = folderName ?? listName,
				taskName = folderName ? listName : '',
				tagNames = $(tagSelector)
					? () => [
							...new Set(Array.from($$(tagSelector)).map((e) => e.innerText)),
					  ]
					: '';

			const clockifyProps = { description, projectName, taskName, tagNames };

			const link = clockifyButton.createButton(clockifyProps);
			const input = clockifyButton.createInput(clockifyProps);

			link.style.display = 'inline-flex';
			link.style.paddingLeft = '10px';
			link.style.marginRight = '15px';
			link.style.cursor = 'pointer';

			elem.appendChild(link);
			elem.appendChild(input);
		}, 2000);
	}
);

// List
clockifyButton.render(
	'.cu-task-row__container:not(.clockify)',
	{ observe: true },
	(elem) => {
		setTimeout(() => {
			const tagSelector = '.cu-tags-select__name';
			const { projectName, taskName } = getProjectAndTask(elem);
			const tagNames = $(tagSelector, elem)
				? () => [
						...new Set(
							Array.from($$(tagSelector, elem)).map((e) => e.innerText)
						),
				  ]
				: '';
			const description =
				elem.dataset.test && elem.dataset.task
					? `${elem.dataset.test.split('__')[2]} | #${elem.dataset.task}`
					: '';

			const link = clockifyButton.createButton({
				description,
				projectName,
				tagNames,
				taskName,
				small: true,
			});

			link.style.position = 'absolute';
			link.style.right = '-15px';
			link.style.top = '8px';
			link.style.cursor = 'pointer';
			link.style.zIndex = '99999';

			$('[data-test=task-row-main__link]', elem).parentElement.appendChild(
				link
			);
		}, 2000);
	}
);

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

function getDashboardFolderAndListName(elem) {
	const getListGroup = (taskContainer) => {
		if (!taskContainer) return;

		let parent = taskContainer;

		while (!parent?.classList?.contains('cu-list-group') && parent)
			parent = parent?.parentElement;

		return parent;
	};

	const listGroup = getListGroup(elem);

	const dashboardFolderName = $(
		'.cu-list-group__category-name.ng-star-inserted',
		listGroup
	)?.textContent;

	const listName = $('.cu-list-group__name', listGroup)?.textContent;

	return { dashboardFolderName, listName };
}

function getProjectAndTask(elem) {
	const groupedBy = document
		.querySelector('[data-test="selected_groupBy"]')
		.textContent.trim();

	const { dashboardFolderName, listName } = getDashboardFolderAndListName(elem);

	const asideBarExtendedFolder = $('.nav-category__header_opened');
	const asideBarExtendedFolderOpened =
		asideBarExtendedFolder?.parentElement?.classList?.contains(
			'nav-category_child-selected'
		);

	// Case 1: Group by criteria isn't set to Status (integration shouldn't pick up poject or task)
	if (groupedBy !== 'Status') return { projectName: '', taskName: '' };

	// Case 2: Folder name is shown up in Dashboard table by list groups
	if (dashboardFolderName)
		return {
			projectName: dashboardFolderName,
			taskName: listName,
		};

	// Case 3: Folder name is shown up in aside list bar
	if (asideBarExtendedFolderOpened)
		return {
			projectName: asideBarExtendedFolder.textContent,
			taskName: listName,
		};

	// Case 4: List does not exist inside folder (integration should pick up only list name as a project)
	return { projectName: listName, taskName: '' };
}
