renderCardButton();
observeTicketSubjectChanges();

function renderCardButton() {
	removeExistingClockifyButton();

	setTimeout(() => {
		clockifyButton.render(
			'.page-actions__left:not(.clockify)',
			{ observe: true },
			(elem) => {
				const ticketSubject = () => text('.sentiment-ticket-heading');
				const ticketNumber = () => text('.breadcrumb__item.active');
				const description = () => `[#${ticketNumber()}] ${ticketSubject()}`;

				const link = clockifyButton.createButton({ description });

				link.style.marginLeft = '10px';
				link.style.display = 'inline-flex';
				link.style.verticalAlign = 'middle';

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
}
