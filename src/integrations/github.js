
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

if (typeof ScopedSingleton_GitHubProjectView === 'undefined') {
	function ScopedSingleton_GitHubProjectView() {
		this.init = async () => {
			// todo: there should be a better way to do this using available helper module in this extension.
			const storage = await localStorage.aBrowser.storage.local.get();
			this.projects = storage.preProjectList.projectList.map((r) => {
				return { name: r.name, id: r.id };
			});

			this.setProjectFromPage();
		};

		this.setProjectFromPage = () => {
			this.githubProjectName = this.getProjectNameOnProjectView();
			this.project = this.matchProjectNameAgainstKnownProjects(this.githubProjectName, this.projects);
			if (!this.project) {
				//console.warn("Clockify: Unable to locate existing project (by name) for this github project board: "+ this.githubProjectName, this.projects.map(x=> x.name));
				this.projectName = this.githubProjectName;
			}
			else {
				//console.debug("Clockify: Located existing project for this GitHub project board: " + this.githubProjectName, this.project);
				this.projectName = this.project.name;
			}
		};

		this.processIssueUrl = (url) => {
			if (!url) url = window.location.href;
			const url_parts = url.split('/');

			if (url_parts.length >= 5) {
				this.githubProjectName = url_parts[4];
				this.project = this.matchProjectNameAgainstKnownProjects(this.githubProjectName, this.projects);
				if (!this.project) {
					let repo_url = url.substring(0, url.lastIndexOf('/issues'));
					console.warn("Clockify: Unable to locate existing project (by name) for repo of this github project board: "+ this.githubProjectName, repo_url, this.projects.map(x=> x.name));

					this.projectName = this.githubProjectName;
				}
				else {
					this.projectName = this.project.name;
				}
			}
			else {
				//console.debug('Clockify: URL of issue link is not in expected format: ', url);
			}
			return this.projectName;
		};

		this.getProjectNameOnProjectView = () => {
			const projectName = text('h1[class^=Text]');
			return projectName;
		};

		this.matchProjectNameAgainstKnownProjects = (projectName, projects) => {
			if (!projectName || projectName.length<1) return;
			const project = projects.find((p) => projectName.toLowerCase().includes(p.name.toLowerCase()));
			return project;
		};

		this.setTitleColumnIndex = (idx) => {
			this.titleColumnIndex = idx;
		};

		this.setLabelsColumnIndex = (idx) => {
			this.labelsColumnIndex = idx;
		};
	};
}



// Sidepanel issue view (project details)
clockifyButton.render(
	'div[data-testid="side-panel-title"]:not(.clockify)',
	{ observe: true },
	async (sidepanelHeader) => {
		await timeout({ milliseconds: 1200 });

		const singleton = new ScopedSingleton_GitHubProjectView();
		await singleton.init();

		// if we couldn't locate a clockify project based one the name of the Github project, we can instead try to locate the repo name from any issue link on the board (if any exists).
		if (!singleton.project) {
			// first try and attain it from the page again..
			singleton.processIssueUrl();

			if (!singleton.project) {
				console.debug('unable to locate a project based on the name of the Github project. Trying to locate the repo name from any issue link on the board (if any exists).');
				let target = $(`[data-test-cell-is-focused="true"] a`);
				if (target) {
					singleton.processIssueUrl(target.getAttribute('href'));
					//console.debug(singleton.projectName);
				}
			}
		}

		const issueId = text('span', sidepanelHeader);
		const issueTitle = text('bdi', sidepanelHeader);
		//const openedIssue = $('[data-test-cell-is-focused="true"] a');
		const repositoryName = singleton.projectName;// const repositoryName = openedIssue.href.split('/')[4];

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

// Project View (kanban cards)
(async () => {
	const selector_card = '.board-view-column-card:not(.clockify)';
	const selector_card_header = 'div[data-testid=board-card-header]';

	const singleton = new ScopedSingleton_GitHubProjectView();
	await singleton.init();
	
	clockifyButton.render(
		selector_card,
		{ observe: true },
		(card) => {
			if (!card) return;

			// if we couldn't locate a clockify project based one the name of the Github project, we can instead try to locate the repo name from any issue link on the board (if any exists).
			if (!singleton.project) {
				// first try and attain it from the page again..
				singleton.processIssueUrl();

				if (!singleton.project) {
					console.debug('unable to locate a project based on the name of the Github project. Trying to locate the repo name from any issue link on the board (if any exists).');
					let target = $(`${selector_card} ${selector_card_header} + a[href*=github]`);
					if (target) {
						singleton.processIssueUrl(target.getAttribute('href'));
						//console.debug(singleton.projectName);
					}
				}
			}

			const card_header = $(selector_card_header, card);
			if (!card_header) return; // lazy-loaded cards can't be processed yet.
			
			let desired_container = null;
			try {
				// try and find the container where the button should be placed. It will fail for cards that are not yet lazy-loaded due to scroll visibility.
				desired_container = $('& div[class^=Box-sc]:last-child', card_header);
			}
			catch(ex) {
				//console.debug(ex);
				return; // silently fail, it will be processed later when user scrolls.
			}
			//console.debug(card_header, desired_container);

			const card_id = card.getAttribute('data-board-card-id');
			const card_title = text('h3', card);
			//console.debug(card_id, card_title);

			let issueId = null;
			const issue_link = $(`${selector_card_header} + a[href*=github]`, card)?.getAttribute('href');
			//console.debug(issue_link);
			if (issue_link) {
				issueId = '#'+issue_link.split('/').pop();
			}

			const description = [card_title, issueId].filter(x=> x).join(' ');
			const projectName = singleton.projectName;

			const taskName = [issueId, card_title].filter(x=> x).join(' ');;
			// github Labels may or may not be visible based on user's board configuration. Let's try to nab them..
			const tagNames = textList('ul[data-testid=card-labels] li span[class^=Text-sc]', card);

			const entry = { description, projectName, taskName, tagNames };
			//console.debug(entry);

			const buttonOptions = {
				...entry,
				small: true,
			}
			const link = clockifyButton.createButton(buttonOptions);
			link.style.padding = '3px 14px';

			// append to the end of the "Draft" or "Issue #id" container.
			desired_container.append(link);
		}
	);
})();

// Project view (table perspective)
(async () => {
	const singleton = new ScopedSingleton_GitHubProjectView();
	await singleton.init();

	// in table mode, we need to handle the Header row first, to identify which column position contains the "Title" column. If there is no Title configured for the user, then how can we possible attain the task name? In that case, we skip all functionality here.
	// our selector below for clockifyButton.render Includes the first row of the table, which is the header row.
	
	clockifyButton.render(
		'div[data-testid=table-scroll-container] div[role="row"]:not(.clockify)',
		{ observe: true },
		(row) => {
			if (!row) return;
			
			if ($('div[data-testid^=TableColumnHeader]', row)) {
				// this is the header row. We need to locate the column position of the "Title" column.
				const columns = $$('div[data-testid^=TableColumnHeader]', row);
				//console.debug(columns);
				columns.forEach((column, idx) => {
					const column_config_name = column.getAttribute('data-testid');
					if (column_config_name.includes('id: Title')) {
						//console.debug('Located the "Title" column in the table view. It is at position: ', idx);
						singleton.setTitleColumnIndex(idx);
					}
					else if (column_config_name.includes('id: Labels')) {
						//console.debug('Located the "Labels" column in the table view. It is at position: ', idx);
						singleton.setLabelsColumnIndex(idx);
					}
				});
				return; // we handled the header row. process nothing else.
			}

			if (typeof singleton.titleColumnIndex == 'undefined' && !singleton.hasWarnedMissingTitle) {
				singleton.hasWarnedMissingTitle=true;
				console.warn('Clockify: Unable to locate the "Title" column in the table view. Skipping processing for current page perspective.');
				return;
			}

			// if we couldn't locate a clockify project based one the name of the Github project, we can instead try to locate the repo name from any issue link on the board (if any exists).
			if (!singleton.project) {
				// first try and attain it from the page again..
				singleton.processIssueUrl();

				if (!singleton.project) {
					console.debug('unable to locate a project based on the name of the Github project. Trying to locate the repo name from any issue link on the board (if any exists).');
					let target = $(`${selector_card} ${selector_card_header} + a[href*=github]`);
					if (target) {
						singleton.processIssueUrl(target.getAttribute('href'));
						//console.debug(singleton.projectName);
					}
				}
			}

			// at this point, we are operating on a valid "issue" row in a table view. And we have a valid title index, so we know where to scan for a task title.
			const offset = 1 + 1; // 1 for 0-based index, and 1 for the "Actions" cell that Github puts at the start of each row..
			const taskTitle_row_selector = `& > div:nth-child(${singleton.titleColumnIndex + offset})`;
			const taskTitle_row_text_selector = `${taskTitle_row_selector} span[class^=Text]`;
			const taskTitle = text(taskTitle_row_text_selector, row);
			
			// when taskTitle is undefined, it's likely the final row -- the one used to Add a new row in Github.
			if (!taskTitle) {
				return;
			}

			let desired_container = null;
			try {
				// try and find the container where the button should be placed. It will fail for rows that are not yet lazy-loaded due to scroll visibility.
				desired_container = $(taskTitle_row_selector, row);
			}
			catch(ex) {
				//console.debug(ex);
				return; // silently fail, it will be processed later when user scrolls.
			}

			// let's try and grab any labels that are visible in the table view.
			let tagNames = [];
			if (typeof(singleton.labelsColumnIndex)!=='undefined') {
				const label_selector = `& > div:nth-child(${singleton.labelsColumnIndex + offset}) span[class^=Text]`;
				tagNames = textList(label_selector, row);
				//console.debug(tagNames);
			}

			const entry = { description: taskTitle, projectName: singleton.projectName, tagNames };
			//console.debug(entry);

			const buttonOptions = {
				...entry,
				small: true,
			}
			const link = clockifyButton.createButton(buttonOptions);
			link.style.padding = '3px 14px';
			link.style.position = 'absolute';
			link.style.right = '0px';
			link.style.top = '7px';
			link.style.zIndex = '9';
			desired_container.style.position = 'relative';

			// append to the end of Title row. absolutely in "overlay" css mode.
			desired_container.append(link);
		},
		'div[data-testid=app-root] div[id^=project-view] div'
	);
})();
