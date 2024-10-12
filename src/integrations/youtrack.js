/* the first selector is required for youtrack-5 and the second for youtrack-6 */
clockifyButton.render(
	'.fsi-toolbar-content:not(.clockify), .toolbar_fsi:not(.clockify)',
	{ observe: true },
	function (elem) {
		let description;
		const numElem = $('a.issueId');
		const titleElem = $('.issue-summary');

		const projectElem = $(
			'.fsi-properties a[title^="Project"], .fsi-properties .disabled.bold'
		);

		description = titleElem.textContent;
		description = numElem.firstChild.textContent.trim() + ' ' + description.trim();

		const link = clockifyButton.createButton(description, projectElem.textContent);
		elem.insertBefore(link, titleElem);
	}
);

/* new view for single issues — obligatory since YouTrack 2018.3 */
clockifyButton.render('.yt-issue-view:not(.clockify)', { observe: true }, function (elem) {
	const issueId = elem.querySelector('.js-issue-id').textContent;
	const link = clockifyButton.createButton(
		issueId + ' ' + $('h1').textContent.trim(),
		issueId.split('-')[0]
	);
	const toolbar = $('.yt-issue-toolbar');
	link.style.paddingLeft = '20px';
	elem.style.display = 'flex';
	toolbar.appendChild(link);
});

// lite view for single issues
// $('h1[data-test="ticket-summary"]')
clockifyButton.render(
	'[data-test="issue-container"]:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async elem => {
		if ($('.clockify-container', elem)) return;

		await timeout({ milliseconds: 1000 });
		const ticketId = () => text('[id*="id-link"]', elem);
		const ticketTitle = () => text('[data-test="ticket-summary"]', elem);

		const description = () => `${ticketId()} ${ticketTitle()}`;
		const projectName = () => text('[aria-label="Project"] span[class^="fieldValue"]');
		const tagNames = () => textList('[class*="tags"] a', elem);

		const entry = { description, projectName, tagNames, small: true };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		input.style.marginLeft = '16px';

		const clockifyContainer = createTag('div', 'clockify-container');
		clockifyContainer.style.display = 'flex';
		clockifyContainer.style.alignItems = 'center';
		clockifyContainer.append(link);
		clockifyContainer.append(input);

		const modalHeader = $('.summaryToolbar__c231', elem);
		const firstChild = $('div', modalHeader);
		modalHeader.insertBefore(clockifyContainer, firstChild.nextSibling);
	}
);

// Cards view
clockifyButton.render('.yt-agile-card:not(.clockify)', { observe: true }, youtrackCard => {
	const cardId = () => text('.yt-agile-card__summary span:nth-child(1) a', youtrackCard);
	const cardTitle = () => text('.yt-agile-card__summary span:nth-child(2)', youtrackCard);

	const description = () => `${cardId()} ${cardTitle()}`;
	const tagNames = () => textList('.yt-issue-tags__tag', youtrackCard);

	const entry = { description, tagNames, small: true };

	const link = clockifyButton.createButton(entry);

	link.style.position = 'absolute';
	link.style.top = '10px';
	link.style.right = '10px';

	youtrackCard.append(link);
});

// Modal view
clockifyButton.render(
	'[data-test*="ticket-view-dialog"]:not(.clockify)',
	{ observe: true },
	async taskModal => {
		await timeout({ milliseconds: 1000 });
		await waitForElement('[data-test="fields-sidebar"]', taskModal);

		const ticketId = () => text('[id*="id-link"]', taskModal);
		const ticketTitle = () => text('[data-test="ticket-summary"]', taskModal);

		const description = () => `${ticketId()} ${ticketTitle()}`;
		const projectName = () => text('[aria-label="Project"] span[class^="fieldValue"]');
		const tagNames = () => textList('[class*="tags"] a', taskModal);

		const entry = { description, projectName, tagNames };

		const link = clockifyButton.createSmallButton(entry);
		const input = clockifyButton.createInput(entry);

		input.style.marginLeft = '16px';

		const clockifyContainer = createTag('div');
		clockifyContainer.style.display = 'flex';
		clockifyContainer.style.alignItems = 'center';
		clockifyContainer.append(link);
		clockifyContainer.append(input);

		const modalHeader = $('.summaryToolbar__c231', taskModal);
		modalHeader.append(clockifyContainer);
	}
);

applyStyles(`
	.clockify-container {
		display: flex;
		flex: 1;
		justify-content: end;
	}
`);

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.body;
	const observationConfig = { childList: true, attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const isDarkThemeEnabled = Array.from(document.body.classList).join(' ').includes('dark');

	const darkStyles = `
		#clockify-manual-input-form input { background: #28343d !important; color: #f5f4f3 !important; border: 0.5px solid #28343d !important; }
		#clockify-manual-input-form input:hover { border-color: #6a696a !important; transition: border-color 100ms; }
		.clockify-button-inactive { color: #f5f4f3 !important; }
	`;
	const lightStyles = `
		.clockify-input { background: white !important; color: #28343d !important; border: 1px solid white !important; }
		.clockify-input:hover { border-color: #cfcbcb !important; transition: border-color 100ms; }
		.clockify-button-inactive { color: #444444 !important };
	`;

	const stylesToApply = isDarkThemeEnabled ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
