clockifyButton.render(
	'.ticket-header-end:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async actionBar => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton')) return;

		const ticketSubject = () =>
			text('.sentiment-ticket-heading') ||
			document.title.split(' ').slice(1).join(' ').split(' : ').slice(0, -1).join('');
		const ticketNumber = () =>
			text('.breadcrumb__item.active') ||
			location.pathname.match(new RegExp(`/tickets/(\\d+)`))?.[1];
		const description = () => `[#${ticketNumber()}] ${ticketSubject()}`;

		const link = clockifyButton.createButton({ description });

		link.style.width = '110px';

		actionBar.prepend(link);
	}
);
