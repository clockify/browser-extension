// Opened ticket view
clockifyButton.render(
	'.zd_v2-ticketdetailview-container:not(.clockify)',
	{ observe: true },
	() => {
		const ticketId = text('.zd_v2-ticketsubject-ticketIdText');
		const ticketSubject = text('[data-id="caseSubjectText"]');

		const description = `[#${ticketId}##] ${ticketSubject}`;

		const link = clockifyButton.createButton({ description, small: true });

		link.style.marginRight = '15px';

		const actions = $('.zd_v2-ticketsubject-rightSideDiv');

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
	(ticketCard) => {
		ticketCard.classList.add('clockify-trello-card');

		ticketCard.addEventListener('mouseover', () => {
			const isButtonAlreadyAdded = $('.clockifyButton', ticketCard);
			if (isButtonAlreadyAdded) return;

			const ticketId = text('a.zd_v2-ticketidwrapper-ticketId', ticketCard);
			const ticketSubject = text('a .zd_v2-kanbanlistitem-subject', ticketCard);

			const description = `[#${ticketId}##] ${ticketSubject}`;

			const link = clockifyButton.createButton({ description, small: true });

			link.style.position = 'absolute';
			link.style.right = '64px';
			link.style.bottom = '16px';

			ticketCard.append(link);
		});
	}
);
