clockifyButton.render(
	'.task-details-main:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description = $('.task-pane-name-field-textarea', elem).textContent;
		project = $(
			'#app-pane > div.navigation-content-views.with-height-animation > div > div.task-pane-inner > div.task-details-wrap > div.task-pane-details-wrapper > div > div > div > div.task-details-main.clockify > div.task-details-list > a:nth-child(2)'
		).textContent;
		link = clockifyButton.createButton(description, project);
		link.style.display = 'block';
		link.style.cursor = 'pointer';
		elem.appendChild(link);
	}
);
