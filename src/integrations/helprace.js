clockifyButton.render(
	'.components-tickets-view .top-toolbar .b-toolbar:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description = $('#extension_data').dataset.description;
		const projectName = $('#extension_data').dataset.project ?? '';
		const tagNames = Array.from($$('.b-text-field_multiline_tags li span')).map(
			(tag) => tag.textContent
		);

		const link = clockifyButton.createButton({
			description,
			projectName,
			tagNames,
		});

		link.style.marginTop = '4px';

		elem.append(link);
	}
);
