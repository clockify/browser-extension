// Issue view, PR view
clockifyButton.render(`.gh-header-actions:not(.clockify)`, { observe: true }, actions => {
	const repositoryName = location.href.split('/')[4];

	const id = text('.gh-header-number') || text('[aria-label="Header"] h2 a');
	const title = text('.js-issue-title');

	const description = () => `${id} ${title}`;
	const projectName = () =>
		repositoryName ||
		text('[aria-label="Page context"] ul li:nth-child(2) span') ||
		text('[itemprop="name"] a');
	const taskName = () => `${id} ${title}`;
	const tagNames = () => textList('.IssueLabel');

	const entry = { description, projectName, taskName, tagNames };

	const timer = clockifyButton.createTimer(entry);
	const input = clockifyButton.createInput(entry);

	timer.style.padding = '3px 14px';

	actions.prepend(timer);
	actions.prepend(input);
});

// Issue sidepanel view (project details)
clockifyButton.render(
	'[class*=issueViewerContainer]:not(.clockify)',
	{ observe: true },
	async sidepanelHeader => {
		const issueId = await waitForText('h1 bdi + span, [data-testid="issue-header"] a');
		const issueTitle = await waitForText('bdi', sidepanelHeader);
		const repositoryName = $('[data-testid="issue-header"] a').href.split('/')[4];

		const description = `${issueId} ${issueTitle}`;
		const projectName = repositoryName;
		const taskName = `${issueId} ${issueTitle}`;
		const tagNames = textList('[data-testid="issue-labels"] [class*="TokenTextContainer"]');

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		const actions = await waitForElement('[data-component="PH_Actions"] > div');

		container.style.display = 'flex';
		container.style.gap = '8px';

		actions.prepend(container);
	}
);

// Project - board view
clockifyButton.render(
	'[data-board-card-id]:not(.clockify)',
	{ observe: true, showTimerOnhover: '[data-board-card-id]' },
	async card => {
		const cardDataContainer = (await waitForElement('[aria-label="Fields"]', card))
			.previousElementSibling;

		const id = (await waitForText('* span', cardDataContainer)).split(' ')[1];
		const title = await waitForText('* > a', cardDataContainer);
		const repositoryName = (await waitForText('* span', cardDataContainer)).split(' ')[0];

		const description = () => `${id} ${title}`;
		const projectName = () => repositoryName;
		const taskName = () => `${id} ${title}`;
		const tagNames = () => textList('[aria-label="Fields"] li', card);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.style.position = 'absolute';
		timer.style.right = '5px';
		timer.style.bottom = '5px';

		card.append(timer);
	}
);

// Project - table view
clockifyButton.render(
	'#memex-project-view-root [role="row"]:not(.clockify)',
	{ observe: true, showTimerOnhover: '[role="gridcell"]' },
	async row => {
		const titleColumnIndex = getIndexOfCell('title');

		const id = await waitForText('a + div', row);
		const title = await waitForText(`[role="gridcell"]:nth-child(${titleColumnIndex}) a`, row);
		const repositoryName = $('a', row).href.split('/')[4];
		const labelsColumnIndex = getIndexOfCell('labels');
		const tagsSelctor = `[role="gridcell"]:nth-child(${labelsColumnIndex}) [class*="TokenTextContainer"]`;

		const description = () => `${id} ${title}`;
		const projectName = () => repositoryName;
		const taskName = () => `${id} ${title}`;
		const tagNames = () => textList(tagsSelctor, row);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.style.zIndex = '2';
		timer.style.cursor = 'pointer';
		timer.style.width = 'fit-content';
		timer.style.marginLeft = 'auto';

		const titleCell = $(`[role="gridcell"]:nth-child(${titleColumnIndex}) > div`, row);

		titleCell.append(timer);
	}
);

function getIndexOfCell(cellTextContent) {
	const firstRow = $('[role="row"]');
	const allCellsWithinFirstRow = Array.from($$('[role="row"] > *', firstRow));
	const index =
		allCellsWithinFirstRow
			.map(item => item.innerText.toLowerCase().trim())
			.indexOf(cellTextContent.toLowerCase()) + 1;

	return index;
}

applyStyles('.clockifyButton, .clockify-input { font-weight: 400; }');
