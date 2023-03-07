clockifyButton.render(
	'.tasks-view-holder .content-panel-holder .content-panel-head:not(.clockify)',
	{ observe: true },
	elem => {

		let getTaskName, getProjectName, taskID, tagNames, link;

		getTaskName = () => $('.content-panel-title .content-panel-field-input').innerHTML.trim() || 'Add task name...';

		getProjectName = () => {
			let projectName;
			let rows = Array.from($$('.row-task'));
			for (const row of rows) {
				if (row.innerText.includes(`${getTaskName()}`) && row.querySelector('.task-project-name')) {
					projectName = row.querySelector('.task-project-name').innerText;
				}
			}
			if (!projectName) projectName = $('.header-title h1').textContent;
			return projectName;
		};

		taskID = $('.content-panel-head .nice-id') ? $('.content-panel-head .nice-id').innerText : '';

		tagNames = () =>
			Array.from(
				$$('.control .labels-list-item')
			).map((e) => e.innerText);

		link = clockifyButton.createButton({
			description: () => `#${taskID} ${getTaskName()}`,
			projectName: getProjectName(),
			tagNames: () => tagNames()
		});

		elem.appendChild(link);
	}
);
