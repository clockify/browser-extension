clockifyButton.render(
	'#clockify-view:not(.clockify)',
	{ observe: true },
	(elem) => {
		var container = $('#clokify-container', elem);
		if (!container) {
			return;
		}

		var description = $('#task-name');
		description = description ? description.value : '';
		var project = $('#board-title');
		project = project ? project.textContent : '';
		var link = clockifyButton.createButton({
			description: description,
			projectName: project,
			taskName: description,
		});

		container.appendChild(link);
	}
);
