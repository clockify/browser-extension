// PR view, Issue view
clockifyButton.render(
	`[data-testid="issue-header"] [data-component="PH_Actions"]:not(.clockify),
	[class*="PullRequestHeader-module__actionsAboveTitleOnNarrow"] [data-component="PH_Actions"]:not(.clockify)`,
	{ observe: true },
	async actions => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton')) return;

		const isIssuesTab = window.location.pathname.includes('issues');

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
		const tagNames = () =>
			isIssuesTab
				? textList('a[class*=LabelsList-module] > span:first-child')
				: textList('.js-issue-labels .IssueLabel');

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		timer.style.padding = '3px 14px';

		if (isIssuesTab) {
			$('[class*=HeaderMenu-module__menuActionsContainer]', actions).prepend(timer);
			$('[class*=HeaderMenu-module__menuActionsContainer]', actions).prepend(input);
			return;
		}

		actions.prepend(timer);
		actions.prepend(input);
	}
);

// Issue sidepanel view (project details)
clockifyButton.render(
	'[class*=SidePanel-module] [data-component="PH_Actions"] > div:not(.clockify)',
	{ observe: true },
	async actions => {
		const issueId =
			(await waitForText('[data-testid="issue-header"] a[data-hovercard-type="issue"]')) ||
			waitForText('h1 bdi + span, ');
		const issueTitle = await waitForText('[data-testid="issue-title"]');
		const repositoryName = $('[data-testid="issue-header"] a').href.split('/')[4];

		const description = `${issueId} ${issueTitle}`;
		const projectName = repositoryName;
		const taskName = `${issueId} ${issueTitle}`;
		const tagNames = () =>
			textList('[data-testid="issue-labels"] [class*="TokenTextContainer"]');

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		container.style.display = 'flex';
		container.style.gap = '8px';
		container.style.marginRight = '10px';
		input.style.display = 'flex';
		input.style.alignItems = 'center';

		actions.prepend(container);
	}
);

// Project - board view
clockifyButton.render(
	'[data-board-card-id]:not(.clockify)',
	{ observe: true, showTimerOnhover: '[data-board-card-id]', onNavigationRerender: true },
	async card => {
		await timeout({ milliseconds: 500 });
		if ($('.clockifyButton', card)) return;

		const cardHeaderTitle = () => text('[class*="header-module__Text__"]', card).split(' ');
		const id = () => cardHeaderTitle()[1];
		const title = () => text('[id*="board-card-title-"]', card);
		const repositoryName = cardHeaderTitle()[0];

		const description = () => `${id()} ${title()}`;
		const projectName = () => repositoryName;
		const taskName = () => `${id()} ${title()}`;

		const entry = { description, projectName, taskName, small: true };

		const timer = clockifyButton.createTimer(entry);

		$('[data-board-card-id] [class*="header-module__Box_3"]', card)?.append(timer);
	}
);

// Project - table view
clockifyButton.render(
	'[class*="title-renderer-module__titleCell"]:not(.clockify)',
	{ observe: true, showTimerOnhover: '[class*="title-renderer-module__titleCell"]' },
	async row => {
		await timeout({ milliseconds: 750 });
		if ($('.clockifyButton', row)) return;

		const iconAddPlusButton = $('[class*="title-renderer-module__PlusIconContainer"]', row);

		const id = await waitForText('[class*="title-renderer-module__Text"]', row);
		const title = await waitForText('a', row);
		const repositoryName = $('a', row).href.split('/')[4];
		const labelsColumnIndex = getIndexOfCell('labels');
		const tagsSelctor = `[role="gridcell"]:nth-child(${labelsColumnIndex}) [class*="TokenTextContainer"]`;

		const description = () => `${id.trim()} ${title}`;
		const projectName = () => repositoryName;
		const taskName = () => `${id} ${title}`;
		const tagNames = () => textList(tagsSelctor, row);

		const entry = { description, projectName, taskName, tagNames, small: true };

		const timer = clockifyButton.createTimer(entry);

		timer.style.zIndex = '2';
		timer.style.cursor = 'pointer';
		timer.style.width = 'fit-content';
		timer.style.marginLeft = iconAddPlusButton ? '5px' : 'auto';

		row.append(timer);
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
