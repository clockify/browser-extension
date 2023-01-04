clockifyButton.render(
	'body.controller-issues.action-show:not(.admin) #content > h2:not(.clockify)',
	{ observe: false },
	(elem) => {
		var link,
			description,
			numElem = $('#content > h2'),
			titleElem = $('.subject h3') || '',
			projectElem = $('.current-project'),
			actionsElem = $('#content .contextual');

		if (!!$('.clockify-button')) {
			return;
		}

		if (!!titleElem) {
			description = titleElem.textContent.trim();
		}

		if (numElem !== null) {
			if (!!description) {
				description = ' ' + description;
			}
			description = numElem.textContent.trim() + description;
		}

		var tags = () => [];

		link = clockifyButton.createButton({
			description: description,
			projectName: projectElem ? projectElem.textContent.trim() : '',
			taskName: description,
			tagNames: tags,
		});
		link.style.marginRight = '15px';
		link.style.padding = '0px';
		link.style.paddingLeft = '20px';
		actionsElem.appendChild(link);

		var inputForm = clockifyButton.createInput({
			description: description,
			projectName: projectElem ? projectElem.textContent.trim() : '',
			taskName: description,
			tagNames: tags,
		});
		inputForm.style.display = 'inline';
		actionsElem.appendChild(inputForm);
	}
);
