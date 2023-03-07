clockifyButton.render(
	'.card-content:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link, description;

		(description = function () {
			description = $('.card_name', elem);
			if (!description) {
				description = $('.card-name', elem);
			}
			return description && description.textContent.trim();
		}),
			(link = clockifyButton.createButton(description));
		$('.timer, .time-tracker', elem).appendChild(link);
	}
);

clockifyButton.render(
	'.card_box:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link,
			description = $('.card_name', elem).textContent;

		link = clockifyButton.createSmallButton(description);
		link.setAttribute('data-action', 'start-time-entry');
		$('.icon-play', elem).appendChild(link);
	}
);
