// Issue view, PR view
clockifyButton.render(
	'.gh-header-actions:not(.clockify)',
	{ observe: true },
	(actions) => {
		const id = text('.gh-header-number');
		const title = text('.js-issue-title');

		const description = () => `${id} ${title}`;
		const projectName = () =>
			text('[aria-label="Page context"] ul li:nth-child(2) span') ||
			text('[itemprop="name"] a');
		const taskName = () => `${id} ${title}`;
		const tagNames = () => textList('.IssueLabel');

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		link.style.padding = '3px 14px';

		actions.prepend(link);
		actions.prepend(input);
	}
);

// Sidepanel issue view (project details)
clockifyButton.render(
	'div[data-testid="side-panel-title"]:not(.clockify)',
	{ observe: true },
	async (sidepanelHeader) => {
		await timeout({ milliseconds: 1200 });

		const issueId = text('span', sidepanelHeader);
		const issueTitle = text('bdi', sidepanelHeader);
		const openedIssue = $('[data-test-cell-is-focused="true"] a');
		const repositoryName = openedIssue.href.split('/')[4];

		const description = `${issueId} ${issueTitle}`;
		const projectName = repositoryName;
		const taskName = `${issueId} ${issueTitle}`;
		const tagNames = textList('[data-testid="sidebar-field-Labels"] li');

		const container = createTag('div', 'clockify-widget-container');

		container.style.margin = '6px 0px';
		container.style.display = 'flex';
		container.style.gap = '8px';

		const entry = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		container.append(link);
		container.append(input);

		sidepanelHeader.append(container);
	}
);
