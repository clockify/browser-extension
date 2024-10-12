clockifyButton.render(
	'.app-main-wrapper:has(#ticket-details) #mainactionbar .page-actions__left:not(.clockify)',
	{ observe: true },
	actionBar => {
		const ticketSubject = () =>
			text('.sentiment-ticket-heading') ||
			document.title.split(' ').slice(1).join(' ').split(' : ').slice(0, -1).join('');
		const ticketNumber = () =>
			text('.breadcrumb__item.active') ||
			location.pathname.match(new RegExp(`/tickets/(\\d+)`))?.[1];
		const description = () => `[#${ticketNumber()}] ${ticketSubject()}`;

		const link = clockifyButton.createButton({ description });

		link.style.width = 'fit-content';
		link.style.margin = '17px 0';

		actionBar.after(link);
	}
);

/* renderCardButton();
observeTicketSubjectChanges();

function renderCardButton() {
	removeExistingClockifyButton();

	setTimeout(() => {
		clockifyButton.render(
			':not([class*="ticket"]) > .page-actions__left:not(.clockify)',
			{ observe: true },
			elem => {
				const ticketSubject = () =>
					text('.sentiment-ticket-heading') ||
					document.title.split(' ').slice(1).join(' ').split(' : ').slice(0, -1).join('');
				const ticketNumber = () =>
					text('.breadcrumb__item.active') ||
					location.pathname.match(new RegExp(`/tickets/(\\d+)`))?.[1];
				const description = () => `[#${ticketNumber()}] ${ticketSubject()}`;

				const link = clockifyButton.createButton({ description });

				//link.style.marginLeft = '10px';
				//link.style.display = 'inline-flex';
				//link.style.verticalAlign = 'middle';

				elem.append(link);
			}
		);
	}, 700);
}

function removeExistingClockifyButton() {
	$('#clockifyButton')?.remove();
	$('.clockify')?.classList?.remove('clockify');
}

function observeTicketSubjectChanges() {
	const observer = new MutationObserver(renderCardButton);

	const intervalId = setInterval(() => {
		const ticketSubjectContainer = $('.ticket-details-header');

		if (!ticketSubjectContainer) return;

		observer.observe(ticketSubjectContainer, {
			subtree: true,
			characterData: true,
		});

		clearInterval(intervalId);
	}, 3000);
} */
