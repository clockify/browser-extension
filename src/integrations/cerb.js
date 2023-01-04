clockifyButton.render(
	'#widget99:not(.clockify)',
	{ observe: true },
	function (elem) {
		// Find a custom element storing the description or use the conversation title as the description
		const descriptionElement = document.getElementById('clockify-task-name');
		const description =
			descriptionElement !== null
				? descriptionElement.innerText
				: document
						.getElementsByClassName('cerb-subpage')[0]
						.getElementsByTagName('h1')[0].innerText;

		// Find a custom element storing the project name or leave the project name blank
		const projectElement = document.getElementById('clockify-project-name');
		const projectName = projectElement !== null ? projectElement.innerText : '';

		const link = clockifyButton.createButton(description, projectName);
		elem.appendChild(link);
	}
);
