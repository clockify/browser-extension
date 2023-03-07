// Card
clockifyButton.render(
	'.task-container__header:not(.clockify)',
	{ observe: true },
	function (elem) {
		setTimeout(() => {
			if ($('.task-container__header > #clockifyButton')) return true; // prevents start timer duplicating
			const projectSelector =
					'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_folder.ng-star-inserted > span',
				taskSelector = 'h1#task-name',
				//tagSelector ='.task-container.ng-trigger.ng-trigger-loading div.cu-tags-select__name',
				tagSelector = 'div.cu-tags-view__container div.cu-tags-select__name',
				listNameSelector =
					'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_last.breadcrumbs__link_list.ng-star-inserted > span';

			let link,
				task = $(taskSelector) ? $(taskSelector).textContent : '',
				project = $(projectSelector)
					? $(projectSelector).textContent
					: $(listNameSelector)
					? $(listNameSelector).textContent
					: '',
				tags = $(tagSelector)
					? () => [
							...new Set(Array.from($$(tagSelector)).map((e) => e.innerText)),
					  ]
					: '';

			link = clockifyButton.createButton({
				description: document.title,
				projectName: project,
				tagNames: tags,
				taskName: task,
			});

			const inputForm = clockifyButton.createInput({
				description: document.title,
				projectName: project,
				tagNames: tags,
				taskName: task,
			});

			link.style.display = 'inline-flex';
			link.style.paddingLeft = '10px';
			link.style.marginRight = '15px';
			link.style.cursor = 'pointer';

			elem.appendChild(link);
			elem.appendChild(inputForm);
		}, 2000);
	}
);

// List
clockifyButton.render(
	'.cu-task-row__container:not(.clockify)',
	{ observe: true },
	function (elem) {
		setTimeout(() => {
			const getListGroup = (taskContainer) => {
				if (!taskContainer) return true;

				let parent = taskContainer;

				while (!parent.classList.contains('cu-list-group'))
					parent = parent.parentElement;

				return parent;
			};

			const getListName = (listGroup) =>
				$('.cu-list-group__name', listGroup).textContent;

			const getProjectAndTask = () => {
				const groupedBy = document
					.querySelector('[data-test="selected_groupBy"]')
					.textContent.trim();

				if (groupedBy !== 'Status') {
					return { project: '', task: '' };
				}

				const elemListGroup = getListGroup(elem);

				const folder = $(
					'.cu-list-group__category-name.ng-star-inserted',
					elemListGroup
				);

				if (folder) {
					return {
						project: folder.textContent,
						task: getListName(elemListGroup),
					};
				}

				const currentlyOpenedFolder = $('.nav-category__header_opened');

				if (
					currentlyOpenedFolder &&
					currentlyOpenedFolder.parentElement.classList.contains(
						'nav-category_child-selected'
					)
				) {
					return {
						project: currentlyOpenedFolder.textContent,
						task: getListName(elemListGroup),
					};
				}

				return { project: getListName(elemListGroup), task: '' };
			};

			const { project, task } = getProjectAndTask();

			let link,
				tagSelector = '.cu-tags-select__name';
			(tags = $(tagSelector, elem)
				? () => [
						...new Set(
							Array.from($$(tagSelector, elem)).map((e) => e.innerText)
						),
				  ]
				: ''),
				(description =
					elem.dataset.test && elem.dataset.task
						? `${elem.dataset.test.split('__')[2]} | #${elem.dataset.task}`
						: '');

			link = clockifyButton.createButton({
				description,
				projectName: project,
				tagNames: tags,
				taskName: task,
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
