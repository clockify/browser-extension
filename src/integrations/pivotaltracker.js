clockifyButton.render(
	'form.story:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			titleElem = $('textarea', elem),
			id = $('.id.text_value', elem),
			container = $('.edit aside', elem),
			projectName = $('title').textContent;

		if (titleElem === null || container === null) {
			return;
		}

		link = clockifyButton.createButton(id.value + ' ' + titleElem.value);
		link.style.marginLeft = '10px';

		container.appendChild(link);
	}
);
