clockifyButton.render(
	'div[role=menu]:not(.clockify), .IssueStyles-detailsPanel:not(.clockify)',
	{ observe: true },
	function (elem) {
		let description = $('.IssueStyles-header').innerText;
		let project = $('a.XStyles-ellipsis').innerText;

		link = clockifyButton.createButton({
			description: description,
			projectName: project,
		});
		inputForm = clockifyButton.createInput({
			description: description,
			projectName: project,
		});

		link.style.justifyContent = 'flex-start';

		elem.prepend(inputForm);
		elem.prepend(link);
	}
);
