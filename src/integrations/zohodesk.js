// Opened ticket view
clockifyButton.render(
	'.zd_v2-ticketdetailview-container:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async elem => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', elem)) return;

		const ticketId = text('.zd_v2-ticketsubjectui-ticketIdText');
		const ticketSubject = text('[data-id="caseSubjectText"]');

		const description = `[#${ticketId}##] ${ticketSubject}`;

		const link = clockifyButton.createButton({ description, small: true });

		link.style.marginRight = '15px';

		const actions = $('.zd_v2-ticketsubjectui-rightSideDiv');

		actions.style.display = 'flex';
		actions.style.alignItems = 'baseline';
		actions.style.justifyContent = 'end';

		actions.prepend(link);
	}
);

// Ticket card view
clockifyButton.render(
	'.zd_v2-ticketdvleftpanel-sectionContainer .zd_v2-kanbanlistitem-container:not(.clockify)',
	{ observe: true },
	async ticketCard => {
		ticketCard.classList.add('clockify-trello-card');

		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', ticketCard)) return;

		const ticketId = text('a.zd_v2-ticketidwrapper-ticketId', ticketCard);
		const ticketSubject = text('a .zd_v2-kanbanlistitem-subject', ticketCard);

		const description = `[#${ticketId}##] ${ticketSubject}`;

		const link = clockifyButton.createButton({ description, small: true });

		link.style.position = 'absolute';
		link.style.right = '64px';
		link.style.bottom = '16px';

		ticketCard.append(link);
	}
);
