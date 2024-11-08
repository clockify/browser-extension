// Inbox view
clockifyButton.render(
	'[class*=InboxThreadOverview] [class*=DetailHeaderWrapper] [class*="UIBox"]:not([class*="ContactAvatar"]):last-child:not(.clockify)',
	{ observe: true },
	async (elem) => {
		await timeout({ milliseconds: 500 });

		const ticketId = extractIdFromUrl();
		const ticketSubject = text('[data-test-id="ticket-header-name-link"] span');
		const contact = text(
			'[data-test-id="thread-list-member-row"][data-selected="true"] .private-truncated-string__inner'
		);

		const description = `[#${ticketId}] ${ticketSubject} (${contact})`;
		const projectName = text(
			'[data-selenium-test="company-chicklet-title-link"]'
		);

		const link = clockifyButton.createButton({ description, projectName });

		link.style.position = 'relative';
		link.style.order = '-1';
		link.style.marginRight = '11px';

		elem.append(link);
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
	async () => {
		await timeout({ milliseconds: 500 });

		const tabs = $('.private-tabs__list__wrapper [role="navigation"]');

		const id = extractIdFromUrl();
		const name = text('[data-selenium-test="highlightTitle"]');
		const contact = text('[data-selenium-test="contact-chicklet-title-link"]');
		const wrappedContact = contact ? `(${contact})` : '';

		const description = `[#${id}] ${name} ${wrappedContact}`;
		const projectName = () =>
			text('[data-selenium-test="company-chicklet-title-link"]') ||
			text(
				'[data-selenium-test="company-highlight-details"] [data-selenium-test="highlightTitle"] span'
			);

		const link = clockifyButton.createButton({ description, projectName });

		link.style.fontSize = '16px';
		link.style.display = 'block';
		link.style.position = 'absolute';
		link.style.right = '15px';
		link.style.top = '5px';

		tabs.append(link);
	}
);

function extractIdFromUrl() {
	const url = window.location.href;

	const inboxId = url.match(/inbox\/(.*)#/)?.[1];
	const contactId = url.match(/contact\/([^/]+)/)?.[1];
	const recordId = url.match(/record\/[^/]+\/([^/]+)/)?.[1];

	return inboxId || contactId || recordId;
}
