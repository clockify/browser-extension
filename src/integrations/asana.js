// Side panel view - Task or Subtask
clockifyButton.render(
	'.TaskPaneToolbarAnimation-row:not(.clockify)',
	{ observe: true },
	sidepanelHeader => {
		$('.clockify-widget-container', sidepanelHeader)?.remove();

		const sidepanel = $('.TaskPaneBody-main');
		const isSubtaskOpened = $('.TaskAncestry');

		const asanaTaskname = () =>
			text('[role="heading"] textarea', sidepanel) ||
			/* text('[aria-label="Task Name"]') || */
			text('.TaskPane-titleRow textarea') ||
			text('.TaskPane-titleRow :first-child');
		const asanaTaskTags = () => textList('ul [class*="TaskTag"] span');

		const description = asanaTaskname;
		const projectName = () =>
			isSubtaskOpened
				? text('.TaskAncestry-ancestorProject')
				: text('.TaskProjectTokenPill-name');
		const taskName = asanaTaskname;
		const tagNames = asanaTaskTags;

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		const container = createTag('div', 'clockify-widget-container');

		container.append(link);
		container.append(input);

		sidepanelHeader.append(container);
	}
);

// Side panel view - Subtask list
clockifyButton.render(
	'.SubtaskGrid .TaskList [data-task-id]:not(.clockify)',
	{ observe: true },
	subtask => {
		const actions = $('.SubtaskTaskRow-rightChildren', subtask);

		const description = () => text('[id*="Task"]', subtask);
		const projectName = () =>
			text('.TaskProjects .TaskProjectTokenPill-name') ||
			text('.TaskAncestry-ancestorProject');
		const taskName = () => text('[id*="Task"]', subtask);

		const entry = { description, projectName, taskName, small: true };

		const link = clockifyButton.createButton(entry);

		if ($('div.clockifyButton', actions)) return;
		actions.prepend(link);
	}
);

applyStyles(`
	.clockify-widget-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 10px 5px;
		height: 34px;
		width: 230px;
	}
	#clockify-manual-input-form input {
		width: 110px;
		box-shadow: none;
		border: 1px solid white;
		padding: 0 8px;
		font-size: 12px;
		border-radius: 5px;
	}
	#clockify-manual-input-form input:hover {
		border-color: #afabac;
		transition: border-color 100ms;
	}
	.TaskPaneToolbarAnimation-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.TaskPane .TaskPane-body .DropTargetRow #clockifySmallButton {
		display: none;
	}
	.TaskPane .TaskPane-body .DropTargetRow:hover #clockifySmallButton,
	.TaskPane .TaskPane-body .DropTargetRow #clockifySmallButton.active {
		display: inline-flex;
	}
`);

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.body;
	const observationConfig = { childList: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const darkThemeClass = 'DesignTokenThemeSelectors-theme--darkMode';
	const isDarkThemeEnabled = document.body.classList.contains(darkThemeClass);

	const darkStyles = `
		#clockify-manual-input-form input { background: #1e1f21 !important; color: #f5f4f3 !important; border: 0.5px solid #1e1f21 !important; }
		#clockify-manual-input-form input:hover { border-color: #6a696a !important; transition: border-color 100ms; }
		.clockify-button-inactive { color: #f5f4f3 !important; }
	`;
	const lightStyles = `
		.clockify-input { background: white !important; color: #1e1f21 !important; border: 1px solid white !important; }
		.clockify-input:hover { border-color: #cfcbcb !important; transition: border-color 100ms; }
		.clockify-button-inactive { color: #444444 !important };
	`;

	const stylesToApply = isDarkThemeEnabled ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
