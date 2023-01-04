clockifyButton.render(
	'.offcanvas > .border-bottom:not(.clockify)',
	{ observe: true },
	(elem) => {
		$('.clockify-widget-container')?.remove();

		const projectElem = $('.main-wrapper > .sticky-header div[role=textbox]'),
			description = $('.offcanvas-header [role="textbox"] span')?.textContent,
			{ projectName, taskName } = getProjectTask(projectElem);

		const data = { description, projectName, taskName };

		const link = clockifyButton.createButton(data);

		const input = clockifyButton.createInput(data);

		const clockifyContainer = createTag('div', 'clockify-widget-container');

		clockifyContainer.style.margin = '10px 0 10px 20px';
		clockifyContainer.style.display = 'flex';
		clockifyContainer.style.alignItems = 'center';

		link.style.marginRight = '15px';

		$('input', input).style.color = 'rgba(242,242,248,.87)';
		$('input', input).style.borderColor = 'rgba(121,120,156,.3)';
		$('input', input).style.backgroundColor = 'rgba(121,120,156,.3)';

		setInterval(() => {
			$('.clockify-button-inactive')?.style?.setProperty(
				'color',
				'rgba(242,242,248,.87)',
				'important'
			);
		}, 200);

		clockifyContainer.append(link);
		clockifyContainer.append(input);

		elem.before(clockifyContainer);
	}
);

function getProjectTask(projectElem) {
	var projectName = projectElem ? projectElem.textContent : '';
	var taskName = '';

	if (typeof projectName == 'string' && projectName.indexOf(':') > -1) {
		var pNames = projName.split(':');
		projectName = pNames[0];
		taskName = pNames[1];
	}
	return {
		projectName,
		taskName,
	};
}
