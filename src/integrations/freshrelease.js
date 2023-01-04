// Aglie board, largely a copy of the freshworks integration
clockifyButton.render(
	'.entity-wrap:not(.clockify)',
	{ observe: true },
	function (elem) {
		const desc = $('.entity-title', elem).innerText;
		const ticket = $('.entity-key', elem).innerText;

		const link = clockifyButton.createButton('[' + ticket + '] ' + desc);

		link.style.display = 'inline-flex';
		link.style.verticalAlign = 'middle';
		link.style.float = 'right';
		link.style.paddingRight = '4px';

		$('.entity--header', elem).append(link);
	}
);

// Card view, eg *://*.freshrelease.com/ABC/tasks/ABC-123
clockifyButton.render(
	'.app-container:not(.clockify)',
	{ observe: true },
	function (elem) {
		const desc = $('.title', elem).innerText;
		const ticket = $('.page-action__left', elem).innerText.replace(
			'Tasks ',
			''
		);

		const link = clockifyButton.createButton('[' + ticket + '] ' + desc);

		link.style.display = 'inline-flex';
		link.style.verticalAlign = 'middle';
		link.style.paddingTop = '10px';
		link.style.float = 'right';

		$('.title', elem).append(link);
	}
);

// Agile board card side modal
clockifyButton.render(
	'.ember-modal-header:not(.clockify)',
	{ observe: true },
	function (elem) {
		const desc = $('.form-inline', elem).innerText;
		const ticket = $('.entity-key', elem).innerText;

		const link = clockifyButton.createButton('[' + ticket + '] ' + desc);

		link.style.display = 'inline-flex';
		link.style.verticalAlign = 'middle';
		link.style.float = 'right';

		$('.summary-title--content', elem).append(link);
	}
);
