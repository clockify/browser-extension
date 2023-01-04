clockifyButton.render(
	'.page-content .widget-toolbox .pull-left:not(.clockify)',
	{ observe: false },
	(elem) => {
		var link,
			description = document.querySelector('td.bug-summary').textContent,
			project = document.querySelector('td.bug-project').textContent;

		link = clockifyButton.createButton({
			description: description,
			projectName: project,
			taskName: description,
		});
		link.style.position = 'relative';
		link.style.top = '5px';
		link.style.left = '5px';
		elem.appendChild(link);
	}
);

// Classic UI
clockifyButton.render(
	'#view-issue-details:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description = $('td.bug-summary', elem).textContent,
			project = $('td.bug-project', elem).textContent;

		link = clockifyButton.createButton(description);

		$('.form-title', elem).appendChild(link);
	}
);
