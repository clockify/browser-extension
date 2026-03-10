clockifyButton.render(
	'#ticket-status-select:not(.clockify)',
	{ observe: true },
	ticketStatusElem => {
		const description = () => text('.ticket-header .text-field-text');

		const button = clockifyButton.createSmallButton({ description });

		ticketStatusElem.style.display = 'flex';
		button.style.paddingRight = '7px';
		button.style.paddingBottom = '6px';

		ticketStatusElem.prepend(button);
	}
);
