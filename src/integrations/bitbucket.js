clockifyButton.render('#issue-header:not(.clockify)', {}, (elem) => {
	var link,
		description,
		numElem = $('.issue-id'),
		titleElem = $('#issue-title'),
		projectElem = $('.entity-name');

	description = titleElem.textContent;
	if (numElem !== null) {
		description = numElem.textContent.trim() + ' ' + description;
	}
	link = clockifyButton.createButton(description);

	$('#issue-header').appendChild(link);
});

clockifyButton.render('#pull-request-header:not(.clockify)', {}, (elem) => {
	var link,
		description,
		numElem = $('.pull-request-self-link'),
		titleElem = $('.pull-request-title'),
		projectElem = $('.entity-name'),
		parentToAppendTo = '.pull-request-status';

	if (titleElem !== null) {
		description = titleElem.textContent.trim();
		if (numElem !== null) {
			description = numElem.textContent.trim() + ' ' + description;
		}
	} else {
		// Bitbucket Server support as at version v5.9.0
		description = $('.pr-title-jira-issues-trigger').closest('h2').textContent;
		parentToAppendTo = '.pull-request-metadata';
	}

	link = clockifyButton.createButton(description);

	$(parentToAppendTo).appendChild(link);
});

clockifyButton.render(
	'.iterable-item:not(.clockify)',
	{ observe: true },
	(elem) => {
		let container = $('.text', elem);
		let description = $('.execute', elem);
		let sideElem = $('.flex-content', elem);
		sideElem.style.display = 'inline-block';

		let link = clockifyButton.createButton(description.textContent);
		link.style.float = 'right';
		link.style.marginTop = '-20px';
		link.style.marginBottom = '-20px';

		container.appendChild(link);
	}
);
