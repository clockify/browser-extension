(async () => {
	const selectors = await getSelectors('microsoftPlanner');

	const {
		gridView,
		boardView,
		modalView,
		modalViewTemplates,
		boardViewTemplates,
		gridViewTemplates,
	} = selectors;

	// Grid view
	clockifyButton.render(
		gridView.anchor,
		{ observe: true, showTimerOnhover: '.taskGridContainer .grid-row' },
		async taskRow => {
			await timeout({ milliseconds: 500 });
			if ($('.clockifyButton', taskRow)) return;

			const description = () =>
				text(gridView.taskRowName, taskRow) ||
				text('div[id$="_title"] span:not([id*="avatar"])', taskRow);
			const projectName = () =>
				text(gridView.projectName, taskRow) ||
				text('div[id$="_plan"] span:not([id*="avatar"])', taskRow) ||
				textList(gridView.projectNameFromBreadcrumbs)[1] ||
				text(gridView.projectNameFromBreadcrumbsNewUI);
			const tagNamesRegular = () => textList(gridView.taskRowTags, taskRow);
			const tagNamesOverflow = () =>
				ariaLabel(gridView.taskRowOverflowTags, taskRow)?.split(',') ?? [];
			const tagNames = () => [...tagNamesRegular(), ...tagNamesOverflow()];

			const entry = { description, projectName, tagNames, small: true };

			const timer = clockifyButton.createTimer(entry);

			timer.style.position = 'absolute';
			timer.style.marginLeft = '-10px';
			timer.style.zIndex = '100';

			taskRow.prepend(timer);
		}
	);

	// Board view
	clockifyButton.render(boardView.anchor, { observe: true }, async taskCard => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', taskCard)) return;

		const bottomSection = $(boardView.cardBottomSection, taskCard);
		const completeCheckbox = $(boardView.completeCheckbox, taskCard);

		const description = () =>
			text(boardView.cardTaskName, taskCard) ||
			completeCheckbox.nextElementSibling.textContent.trim();
		const projectName = () =>
			textList(boardView.projectNameFromBreadcrumbs)[1] ||
			text(boardView.projectNameFromBreadcrumbsNewUI) ||
			text(boardView.projectName, taskCard) ||
			text(boardView.projectNameNewUI, taskCard);
		const tagNames = () => textList(boardView.cardTaskTags, taskCard);

		const entry = { description, projectName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		if (!bottomSection) {
			timer.style.justifyContent = 'end';
			completeCheckbox.parentElement.nextElementSibling.after(timer);
			return;
		}

		bottomSection.after(timer);
	});

	// Modal view
	clockifyButton.render(
		modalView.anchor,
		{ observe: true, onNavigationRerender: true },
		async taskModal => {
			await timeout({ milliseconds: 750 });
			if ($('.clockifyButton', taskModal)) return;

			const description = () => value(modalView.taskNameInput, taskModal);
			const projectName = () =>
				text(modalView.cardHeaderTitle, taskModal) ||
				text(modalView.cardHeaderTitleNewUI, taskModal);
			const tagNames = () => textList(modalView.cardTaskTags, taskModal);

			const entry = { description, projectName, tagNames };

			const timer = clockifyButton.createTimer(entry);

			timer.style.width = '110px';

			const taksNameInput = await waitForElement(modalView.taskTitleContainer, taskModal);

			taksNameInput.parentElement.parentElement.after(timer);
		}
	);

	// Grid view with new UI (different templates)
	clockifyButton.render(
		gridViewTemplates.anchor,
		{
			observe: true,
			showTimerOnhover: '.grid-body .grid-row',
			onNavigationRerender: true,
		},
		async row => {
			await timeout({ milliseconds: 500 });
			if ($('.clockifyButton', row)) return;

			const description = () => text(gridViewTemplates.taskName, row);
			const projectName = () => $(gridViewTemplates.projectName).innerText.trim();
			const tagNamesRegular = () => textList(gridViewTemplates.tagNames, row);
			const tagNamesOverflow = () =>
				ariaLabel(gridViewTemplates.taskRowOverflowTags, row)?.split(',') ?? [];
			const tagNames = () => [...tagNamesRegular(), ...tagNamesOverflow()];

			const button = clockifyButton.createSmallButton({
				description,
				projectName,
				tagNames,
			});

			button.style.marginLeft = '10px';

			row.prepend(button);
		}
	);

	// Board view with new UI (different templates)
	clockifyButton.render(
		boardViewTemplates.anchor,
		{ observe: true, onNavigationRerender: true },
		async card => {
			await timeout({ milliseconds: 500 });
			if ($('.clockifyButton', card)) return;

			const description = () => text(boardViewTemplates.taskName, card);
			const projectName = () => $(boardViewTemplates.projectName).innerText.trim();
			const tagNames = () => textList(boardViewTemplates.tagNames, card);

			const button = clockifyButton.createSmallButton({
				description,
				projectName,
				tagNames,
			});

			button.style.justifyContent = 'end';
			button.style.paddingRight = '10px';
			button.style.paddingBottom = '10px';

			card.append(button);
		}
	);

	// Modal view new UI (different templates)
	clockifyButton.render(
		modalViewTemplates.anchor,
		{
			observe: true,
			onNavigationRerender: true,
		},
		async modalHeader => {
			await timeout({ milliseconds: 500 });
			if ($('.clockifyButton', modalHeader)) return;

			observeSidebarTitle();

			const description = () => value(modalViewTemplates.taskNameInput, modalHeader);
			const projectName = () => $(modalViewTemplates.projectName).innerText.trim();
			const tagNames = () => textList(modalViewTemplates.tagNames, modalHeader);

			const button = clockifyButton.createSmallButton({
				description,
				projectName,
				tagNames,
			});

			button.style.marginRight = '5px';

			$('.task-details-navigation', modalHeader).prepend(button);
		}
	);
})();

applyDarkModeStyles();

function applyDarkModeStyles() {
	const isDarkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;

	if (!isDarkModeEnabled) return;

	applyStyles(`
		.taskEditor-dialog-content .clockifyButton * { 
			color: white !important;
			background: #292827 !important; 
		}
	`);
}

function observeSidebarTitle() {
	const titleObserver = new MutationObserver(debounce(clockifyButton.rerenderAllButtons, 500));

	const observationTarget = document.querySelector('input[id*="TextField"][data-cy-td-name]');

	if (observationTarget) {
		const observationConfig = { attributes: true, attributeFilter: ['value'] };
		titleObserver.observe(observationTarget, observationConfig);
	}
}

function debounce(func, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}
