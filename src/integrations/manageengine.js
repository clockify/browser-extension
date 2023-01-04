// On premise installation
clockifyButton.render(
	'.requestEditbrsty:not(.clockify)',
	{ observe: true },
	function (elem) {
		const description = $('#requestSubject_ID', elem).textContent;
		const project = 'Tickets to be Allocated';
		const ticketId = $('#requestId', elem).textContent;
		const clockifyCell = document.createElement('td');

		const link = clockifyButton.createButton(
			ticketId + ' : ' + description,
			project
		);

		clockifyCell.appendChild(link);

		$('td#startListMenuItems > table > tbody > tr').appendChild(clockifyCell);
	}
);

// Cloud version
clockifyButton.render(
	'#WorkOrderDetailsTable_CT:not(.clockify)',
	{ observe: true },
	function (elem) {
		const description = $('#details-middle-container h1', elem).textContent;
		const projectElem = $('#projectholder p') || {};
		const project = projectElem.textContent;
		const ticketId = $('#reqid', elem).textContent;
		const clockifyCell = document.createElement('li');

		const link = clockifyButton.createButton(
			ticketId + ': ' + description,
			project
		);

		clockifyCell.appendChild(link);

		$('#details-middle-container ul.reply-actions').appendChild(clockifyCell);
	}
);
