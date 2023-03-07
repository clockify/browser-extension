// List view, kanban view, task modal
clockifyButton.render(
	'.task-modal:not(.clockify), .task-container:not(.clockify)',
	{ observe: true },
	(elem) => {
		const ambraClockifyButton = $('button.clockify-container', elem),
			taskCode = $('.task-code', elem).textContent,
			taskDescription = $('.task-description', elem).textContent,
			description = `${taskCode} ${taskDescription}`,
			projectName = $('.project-name').textContent,
			taskOptions = $('.task-options', elem);

		const link = clockifyButton.createButton({
			description,
			projectName,
			small: true,
		});

		link.style.margin = '0 8px';

		// List & kanban view
		if (ambraClockifyButton) ambraClockifyButton.replaceWith(link);
		// Task modal
		else taskOptions.prepend(link);
	}
);
