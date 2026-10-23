// PR view
clockifyButton.render(
	'[class*="PullRequestHeader-module__actionsAboveTitleOnNarrow"] [data-component="PH_Actions"]:not(.clockify)',
	{ observe: true },
	async actions => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton')) return;

		const repositoryName = location.href.split('/')[4];

		const id = () =>
			text('[data-component=PH_Title] > :last-child > span:first-child') ||
			text('[data-component=PH_Title] > :last-child');
		const title = () => text('[data-component=PH_Title] > :first-child');

		const description = () => `${id()} ${title()}`;
		const projectName = () =>
			repositoryName ||
			text('[aria-label="Page context"] ul li:nth-child(2) span') ||
			text('[itemprop="name"] a');
		const taskName = () => `${id()} ${title()}`;
		const tagNames = () => textList('.js-issue-labels .IssueLabel');

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		timer.style.padding = '3px 14px';

		actions.prepend(timer);
		actions.prepend(input);
	}
);

// Issue view, issue side panel (project details)
clockifyButton.render(
	'[data-testid="issue-header"] [data-component="PH_Actions"]:not(.clockify)',
	{ observe: true },
	async actions => {
		await timeout({ milliseconds: 500 });

		const header = actions.closest('[data-testid="issue-header"]');
		if ($('.clockifyButton', header)) return;

		const id = () => getIssueFromHeader(header).id;
		const title = () => text('[data-testid="issue-title"]', header);

		const description = () => joinIdAndTitle(id(), title());
		const projectName = () => getIssueFromHeader(header).repositoryName;
		const taskName = () => joinIdAndTitle(id(), title());
		const tagNames = () =>
			textList(
				`[data-testid="issue-type-container"] [class*="TokenTextContainer"],
				[data-testid="issue-labels"] [class*="TokenTextContainer"]`
			);

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		container.style.display = 'flex';
		container.style.gap = '8px';
		container.style.marginRight = '10px';
		input.style.display = 'flex';
		input.style.alignItems = 'center';

		const menu = $('[class*="menuActionsContainer"]', actions) || actions;

		menu.prepend(container);
	}
);

// Issue type and labels shown on project board cards and table rows
const itemTagsSelector = `[class*="IssueTypeToken"] [class*="TokenTextContainer"],
	[class*="IssueLabel"] [class*="TokenTextContainer"]`;

// Project - board view
clockifyButton.render(
	'[data-board-card-id]:has([id^="board-card-title-"]):not(.clockify)',
	{ observe: true, showTimerOnhover: '[data-board-card-id]', onNavigationRerender: true },
	async card => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', card)) return;

		const headerTitle = $('[id^="board-card-header-title-"]', card);
		const link = $('a[href*="/issues/"], a[href*="/pull/"]', card);
		const [headerRepositoryName, headerId] = (headerTitle?.textContent.trim() || '').split(' ');
		const { repositoryName = headerRepositoryName, id = headerId } = link
			? parseItemUrl(link.href)
			: {};
		const title = () => text('[id^="board-card-title-"]', card);

		const description = () => joinIdAndTitle(id, title());
		const projectName = () => repositoryName;
		const taskName = () => joinIdAndTitle(id, title());
		const tagNames = () => textList(itemTagsSelector, card);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		const headerActions = headerTitle?.parentElement?.nextElementSibling;

		(headerActions || headerTitle?.parentElement)?.append(timer);
	}
);

// Project - table view
clockifyButton.render(
	'[role="row"] [class*="titleCell"]:not(.clockify)',
	{ observe: true, showTimerOnhover: '[class*="titleCell"]' },
	async cell => {
		await timeout({ milliseconds: 750 });
		if ($('.clockifyButton', cell)) return;

		const row = cell.closest('[role="row"]');
		const iconAddPlusButton = $('[class*="PlusIconContainer"]', cell);

		const link = $('a[href*="/issues/"], a[href*="/pull/"]', cell);
		const { repositoryName, id } = link ? parseItemUrl(link.href) : {};
		const title = () => (link ? link.textContent.trim() : cell.textContent.trim());

		const description = () => joinIdAndTitle(id, title());
		const projectName = () => repositoryName;
		const taskName = () => joinIdAndTitle(id, title());
		const tagNames = () => textList(itemTagsSelector, row);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.style.zIndex = '2';
		timer.style.cursor = 'pointer';
		timer.style.width = 'fit-content';
		timer.style.marginLeft = iconAddPlusButton ? '5px' : 'auto';

		cell.append(timer);
	}
);

// Issue opened in the project side panel has its address in the "issue" query param: owner|repo|number
function getIssueFromHeader(header) {
	const sidePanelIssue = new URLSearchParams(location.search).get('issue');

	if (sidePanelIssue) {
		const [, repositoryName, number] = sidePanelIssue.split('|');

		return { repositoryName, id: `#${number}` };
	}

	const issueFromLocation = parseItemUrl(location.href);
	if (issueFromLocation.id) return issueFromLocation;

	const issueLink = $('a[data-hovercard-type="issue"]', header);

	return issueLink ? parseItemUrl(issueLink.href) : {};
}

function parseItemUrl(url) {
	const [, , repositoryName, type, number] = new URL(url, location.origin).pathname.split('/');

	return ['issues', 'pull'].includes(type) && number ? { repositoryName, id: `#${number}` } : {};
}

function joinIdAndTitle(id, title) {
	return [id, title].filter(Boolean).join(' ');
}

applyStyles('.clockifyButton, .clockify-input { font-weight: 400; }');
