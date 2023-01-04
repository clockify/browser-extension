// Pulse from standard and kanban board
clockifyButton.render(
	'.flexible-header:not(.clockify)',
	{ observe: true },
	(elem) => {
		const kanban = !window.location.href.includes('pulses') ? true : false,
			boardName = $('.board-name h1').textContent,
			description = kanban
				? $('.pulse-page-name-wrapper div span').textContent
				: $('.title-editable').textContent,
			projectName = boardName.includes(':')
				? boardName.split(':')[0]
				: boardName,
			taskName = boardName.includes(':') ? boardName.split(':')[1] : '',
			clockifyContainer = createTag('div', 'clockify-widget-container');

		const data = { description, projectName, taskName };

		const link = clockifyButton.createButton(data);
		const input = clockifyButton.createInput(data);

		clockifyContainer.style.position = 'absolute';
		clockifyContainer.style.top = '14px';
		clockifyContainer.style.right = kanban ? '50px' : '5px';
		clockifyContainer.style.display = 'flex';
		clockifyContainer.style.alignItems = 'center';
		link.style.marginRight = '10px';

		clockifyContainer.appendChild(link);
		clockifyContainer.appendChild(input);

		elem.prepend(clockifyContainer);

		$('.clockify-input', elem).style.paddingLeft = '3px';
	}
);

// Pulse from "my word" board
/* clockifyButton.render(
	'.pulse-page-header-component .pulse-page-name-wrapper:not(.clockify)',
	{ observe: true },
	function (elem) {
		const descriptionElem = () => $('.ds-text-component > span', elem);
		const description = () =>
			descriptionElem() ? descriptionElem().textContent : '';
		const projectElem = () => {
			let projectElem = $(
				'#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left'
			);
			if (!projectElem) {
				projectElem = $(
					'.pulse-page-header-component a.open-pulse-in-board-link'
				);
			}
			return projectElem;
		};
		const project = () => {
			return getProject(projectElem());
		};
		const task = () => {
			return getTask(projectElem());
		};
		link = clockifyButton.createButton(description, project, task);
		link.style.position = 'absolute';
		link.style.top = '5px';
		link.style.left = '60px';
		elem.appendChild(link);
	}
); */

clockifyButton.render(
	'#pulse-card-dialog-component:not(.clockify)',
	{ observe: true },
	(elem) => {
		const boardName = $('.board-name h1').textContent,
			description = $(
				'#pulse-card-dialog-component .ds-editable-component > .ds-text-component > span'
			).textContent,
			projectName = boardName.includes(':')
				? boardName.split(':')[0]
				: boardName,
			taskName = boardName.includes(':') ? boardName.split(':')[1] : '',
			clockifyContainer = createTag('div', 'clockify-widget-container');

		const data = { description, projectName, taskName };

		const link = clockifyButton.createButton(data);
		const input = clockifyButton.createInput(data);

		clockifyContainer.style.position = 'absolute';
		clockifyContainer.style.top = '15px';
		clockifyContainer.style.left = '60px';
		clockifyContainer.style.display = 'flex';
		clockifyContainer.style.alignItems = 'center';
		link.style.marginRight = '10px';

		clockifyContainer.appendChild(link);
		clockifyContainer.appendChild(input);

		elem.prepend(clockifyContainer);

		$('.clockify-input', elem).style.paddingLeft = '3px';
	}
);

// for this version we used dynamic project, because of modal dlgs (chat/timeline views)
/* function getProject(projectElem) {
	var projName = projectElem ? projectElem.textContent : '';
	var taskName = '';

	if (typeof projName == 'string' && projName.indexOf(':') > -1) {
		var pNames = projName.split(':');
		projName = pNames[0];
		taskName = pNames[1];
	}
	return projName;
}

function getTask(projectElem) {
	var projName = projectElem ? projectElem.textContent : '';
	var taskName = '';
	if (typeof projName == 'string' && projName.indexOf(':') > -1) {
		var pNames = projName.split(':');
		projName = pNames[0];
		taskName = pNames[1];
	}
	return taskName;
} */
