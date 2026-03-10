clockifyButton.render(
	'.app-main-wrapper:has(#ticket-details) #mainactionbar .page-actions__left:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async actionBar => {
		await timeout({ milliseconds: 500 });
		
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
		link.style.paddingLeft = '5px';

		actionBar.after(link);
	}
);
