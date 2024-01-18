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
		description =
			numElem.firstChild.textContent.trim() + ' ' + description.trim();

		const link = clockifyButton.createButton(
			description,
			projectElem.textContent
		);
		elem.insertBefore(link, titleElem);
	}
);

/* new view for single issues — obligatory since YouTrack 2018.3 */
clockifyButton.render(
	'.yt-issue-view:not(.clockify)',
	{ observe: true },
	function (elem) {
		const issueId = elem.querySelector('.js-issue-id').textContent;
		const link = clockifyButton.createButton(
			issueId + ' ' + $('h1').textContent.trim(),
			issueId.split('-')[0]
		);
		const toolbar = $('.yt-issue-toolbar');
		link.style.paddingLeft = '20px';
		elem.style.display = 'flex';
		toolbar.appendChild(link);
	}
);

// lite view for single issues
// $('h1[data-test="ticket-summary"]')
clockifyButton.render(
	'div[data-test="issue-container"] summary > h1:not(.clockify)',
	{ observe: true },
	function (elem) {
		const summary = () => {
			return $('div[data-test="issue-container"] summary > h1');
		};

		const issueId = () => {
			return $('div[data-test="issue-container"] a[data-test="ring-link"]')
				.textContent;
		};

		const desc = () => {
			return issueId() + ' ' + summary().textContent.trim();
		};
		const link = clockifyButton.createButton(desc, issueId().split('-')[0]);
		link.style.paddingLeft = '15px';
		elem.parentElement.appendChild(link);
	}
);

// Cards view
clockifyButton.render(
	'.yt-agile-card:not(.clockify)',
	{ observe: true },
	(youtrackCard) => {
		const cardId = () =>
			text('.yt-agile-card__summary span:nth-child(1) a', youtrackCard);
		const cardTitle = () =>
			text('.yt-agile-card__summary span:nth-child(2)', youtrackCard);

		const description = () => `${cardId()} ${cardTitle()}`;
		const projectName = () => cardId();
		const tagNames = () => textList('.yt-issue-tags__tag', youtrackCard);

		const entry = { description, projectName, tagNames, small: true };

		const link = clockifyButton.createButton(entry);

		link.style.position = 'absolute';
		link.style.top = '10px';
		link.style.right = '10px';

		youtrackCard.append(link);
	}
);

// Modal view
clockifyButton.render(
	'[data-test*="ticket-view-dialog"]:not(.clockify)',
	{ observe: true },
	async (taskModal) => {
		await timeout({ milliseconds: 1000 });
		await waitForElement('[data-test="fields-sidebar"]', taskModal);

		const ticketId = () => text('[id*="id-link"]', taskModal);
		const ticketTitle = () => text('[data-test="ticket-summary"]', taskModal);

		const description = () => `${ticketId()} ${ticketTitle()}`;
		const projectName = () => ticketId();
		const tagNames = () => textList('[class*="tags"] a', taskModal);

		const entry = { description, projectName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		link.style.display = 'inline';
		link.style.margin = '20px 0 10px 16px';
		input.style.marginLeft = '16px';

		const modalSidebar = $('[data-test="fields-sidebar"]', taskModal);

		modalSidebar.append(link);
		modalSidebar.append(input);
	}
);
