clockifyButton.render(
	'.toggl-target:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description = elem.getAttribute('data-descr'),
			project = elem.getAttribute('data-proj');

		link = clockifyButton.createButton(description);

		elem.appendChild(link);
	}
);
