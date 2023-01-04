clockifyButton.render(
	'.modal-content .card_container:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link, description;

		description = $('.card_container .body a.title', elem).textContent.trim();
		link = clockifyButton.createButton(description);

		$('.card_container .card .top', elem).appendChild(link);
	}
);
