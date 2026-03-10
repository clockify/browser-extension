// Inbox view
clockifyButton.render(
	'[data-test-id="close-thread-button"]:not(.clockify)',
	{ observe: true },
	async elem => {
		await timeout({ milliseconds: 500 });
		if ($('#clockifyButton')) return;

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

		elem.parentElement.insertAdjacentElement('beforebegin', link);
	}
);

// Help Desk
clockifyButton.render(
	`[data-application-name="svh-help-desk"] [role=heading] > div:first-child:not(.clockify),
	[data-layer-for="Panel"] [role=heading] > div:first-child:not(.clockify)`,
	{ observe: true, onNavigationRerender: true },
	async elem => {
		await timeout({ milliseconds: 1000 });
		if ($('.clockifyButton')) return;

		const name = text('[data-test-id="ticket-header-name-link"] span');
		const contact = text('[data-selenium-test="contact-chicklet-title-link"]');
		const wrappedContact = contact ? `(${contact})` : '';
		const description = `[#${extractIdFromUrl(true)}] ${name} ${wrappedContact}`;
		const projectName = () => text('[data-selenium-test="company-chicklet-title-link"]');

		const link = clockifyButton.createButton({ description, projectName });

		link.style.marginRight = '10px';

		elem.insertAdjacentElement('afterend', link);
	}
);

// Contact, Ticket, Deal and Company view
clockifyButton.render(
	`[data-scroll-trackable-container="left-sidebar"] [data-test-id="record-highlight-main-content"]:not(.clockify)`,
	{ observe: true },
	async elem => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', elem)) return;

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
		link.style.marginBottom = '5px';
		link.style.justifyContent = 'end';
		link.style.position = 'absolute';
		link.style.top = '46px';
		link.style.right = '10px';

		elem.append(link);
	}
);

// Contact, Ticket, Deal and Company view (Preview modal)
clockifyButton.render(
	`[data-test-id="IndexPageInlineSidebar"] [data-test-id="record-highlight-main-content"] > div:first-child:not(.clockify),
	[data-selenium-test="sidebar-preview-panel"] [data-test-id="record-highlight-main-content"] > div:first-child:not(.clockify),
	[data-test-id="order-highlight-card"] > div:first-child > div:first-child:not(.clockify)`,
	{ observe: true },
	async elem => {
		await timeout({ milliseconds: 1000 });
		if ($('.clockifyButton')) return;

		const description = () =>
			text('[data-selenium-test="highlightTitle"]') ||
			text('header[class*=ScrollingColumn] p > div') ||
			text('[data-selenium-test="preview-panel-header"] span');
		const projectName = () =>
			value('[data-selenium-test="property-input-company"]') ||
			text('[data-selenium-test="property-input-name"]') ||
			text(
				'[data-selenium-test="company-highlight-details"] [data-selenium-test="highlightTitle"] span'
			);

		const link = clockifyButton.createButton({ description, projectName });

		link.style.justifyContent = 'end';
		link.style.paddingTop = '5px';
		link.style.paddingRight = '10px';

		elem.insertAdjacentElement('afterend', link);

		applyStyles(`
			#clockifyButton {
				justify-content: end;
			}
		`);
	}
);

function extractIdFromUrl(isHelpDesk = false) {
	const url = window.location.href;

	if (isHelpDesk) {
		return url.match(/\/ticket\/(\d+)\/thread/)?.[1];
	}

	return url.match(/(\d+)(?=\/?(?:[?#]|$))/)?.[1];
}
