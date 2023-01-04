clockifyButton.render(
	'[data-testid="open-card-title-wrapper"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		let description = $('button', elem).textContent;
		let link = clockifyButton.createButton(description);

		link.style.position = 'relative';
		link.style.fontSize = '16px';
		link.style.marginTop = '16px';

		elem.append(link);
	}
);
