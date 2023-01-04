/*jslint indent: 2, unparam: true*/
/*global $: false, document: false, clockifyButton: false*/

// Tickets
clockifyButton.render(
	'#ticket_tabs_container #ticket_thread:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description,
			titleElem = $('.flush-left a'),
			projectElem = $('.tixTitle'),
			ticketNameText = titleElem.textContent.trim(),
			projectNameText = projectElem.textContent.trim();

		description = ticketNameText + ' [' + projectNameText + ']';
		link = clockifyButton.createButton(description);

		$('.flush-left h2').append(link);
	}
);

// Tasks
clockifyButton.render(
	'#task_thread_container #task_thread_content:not(.clockify)',
	{
		observe: true,
	},
	(elem) => {
		var link,
			description,
			titleElem = $('.flush-left a'),
			projectElem = $('.tixTitle'),
			ticketNameText = titleElem.textContent.trim(),
			projectNameText = projectElem.textContent.trim();

		description = ticketNameText + ' [' + projectNameText + ']';

		link = clockifyButton.createButton(description);

		$('.flush-left h2').append(link);
	}
);
