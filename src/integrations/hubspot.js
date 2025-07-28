// Inbox view
clockifyButton.render(
	'[role=main] [role=group]:first-child:not(.UIButtonGroup):not(.clockify)',
	{ observe: true },
	async elem => {
		await timeout({ milliseconds: 500 });

		const ticketId = extractIdFromUrl();
		const contact = text(
			'[data-test-id=thread-list-member-row][data-selected=true] [data-test-id="member-header"] [data-content="true"]'
		);

		const description = `[#${ticketId}] ${contact}`;
		const projectName = text('[data-selenium-test="company-chicklet-title-link"]');

		const link = clockifyButton.createButton({ description, projectName });

		link.style.position = 'relative';
		link.style.order = '-1';
		link.style.marginRight = '11px';

		elem.insertAdjacentElement('beforebegin', link);
	}
);

// Help Desk
clockifyButton.render(
	'[role=heading] > div:first-child:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async elem => {
		const name = text('[data-test-id="ticket-header-name-link"] span');
		const contact = text('[data-selenium-test="contact-chicklet-title-link"]');
		const wrappedContact = contact ? `(${contact})` : '';
		const description = `[#${extractIdFromUrl()}] ${name} ${wrappedContact}`;
		const projectName = () => text('[data-selenium-test="company-chicklet-title-link"]');

		const link = clockifyButton.createButton({ description, projectName });

		link.style.marginRight = '10px';

		elem.insertAdjacentElement('afterend', link);
	}
);

// Contact, Ticket, Deal and Company view
clockifyButton.render(
	`
	[data-selenium-test="contact-highlight-details"]:not(.clockify),
	[data-selenium-test="ticket-highlight-details"]:not(.clockify),
	[data-selenium-test="deal-highlight-details"]:not(.clockify),
	[data-selenium-test="company-highlight-details"]:not(.clockify)
	`,
	{ observe: true },
	async elem => {
		const id = extractIdFromUrl();
		const name = text('[data-selenium-test="highlightTitle"]');
		const contact = text('[data-selenium-test="contact-chicklet-title-link"]');
		const wrappedContact = contact ? `(${contact})` : '';

		const description = `[#${id}] ${name} ${wrappedContact}`;
		const projectName = () =>
			text('[data-selenium-test="company-chicklet-title-link"]') ||
			text(
				'[data-selenium-test="company-highlight-details"] [data-selenium-test="highlightTitle"] span'
			) ||
			text('[data-selenium-test="card-id-ASSOCIATION_TABLE/0-2"] td:first-child a');

		const link = clockifyButton.createButton({ description, projectName });

		link.style.fontSize = '16px';
		link.style.display = 'block';
		link.style.position = 'absolute';
		link.style.right = '15px';
		link.style.top = '40px';

		elem.append(link);
	}
);

function extractIdFromUrl() {
	const url = window.location.href;

	const inboxId = url.match(/inbox\/(.*?)(#|$)/)?.[1];
	const contactId = url.match(/contact\/([^/]+)/)?.[1];
	const recordId = url.match(/record\/[^/]+\/([^/]+)/)?.[1];
	const ticketId = url.match(/ticket\/([^/]+)/)?.[1];

	return inboxId || contactId || recordId || ticketId;
}
