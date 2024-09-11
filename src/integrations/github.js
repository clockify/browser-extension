/*
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

// Project View (kanban cards)
(async () => {
	const selector_card = '.board-view-column-card:not(.clockify)';
	const selector_card_header = 'div[data-testid=board-card-header]';

	const storage = await localStorage.aBrowser.storage.local.get();
	const projects = storage.preProjectList.projectList.map((r)=> {return {name: r.name, id: r.id}});
	//console.debug('known projects: ', projects);

	const ScopedSingleton = function(){
		this.project=null;
		this.repositoryName = null;
		this.locatedIssueBasedRepoName = false;
		
		this.processUrl = function(url) {
			const url_parts = url.split('/');

			if (url_parts.length >= 5) {
				this.locatedIssueBasedRepoName = true;
				this.repositoryName = url_parts[4];
				this.project = projects.find((p)=> p.name === this.repositoryName);
				if (!this.project) {
					let repo_url = url.substring(0, url.lastIndexOf('/issues'));
					console.warn("Clockify: Unable to locate existing project (by name) for repo of this github project board: "+ this.repositoryName, repo_url, projects.map(x=> x.name));
				}
			}
			return this.repositoryName;
		}.bind(this);
		return this;
	}();
	
	clockifyButton.render(
		selector_card,
		{ observe: true },
		(card) => {
			if (!card) return;

			// by default, use the name of the board as the project...
			if (!ScopedSingleton.repositoryName) {
				ScopedSingleton.repositoryName = text('h1[class*=Text-sc]', document);
			}
			// ideally we'd locate at least one card with the repository link the first time this code runs. 
			// the only way to attain the Repository id from the Project View, is if one of the cards contains the issue link (which happens to contain the url of the repository).
			// i see no other way, outside of utilizing github API to fetch it, which would be overkill and require the repo to be public or oauth'd. Way beyond scope no?
			if (!ScopedSingleton.locatedIssueBasedRepoName) {
				let target = $(`${selector_card} ${selector_card_header} + a[href*=github]`);
				if (target) {
					ScopedSingleton.processUrl(target.getAttribute('href'));
					//console.debug(ScopedSingleton.repositoryName);
				}
			}

			const card_header = $(selector_card_header, card);
			if (!card_header) return; // lazy-loaded cards can't be processed yet.
			
			let desired_container = null;
			try {
				// try and find the container where the button should be placed. It will fail for cards that are not yet lazy-loaded due to scroll visibility.
				desired_container = $('& div[class*=Box-sc]:last-child', card_header);
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
			const projectName = ScopedSingleton.repositoryName;

			const taskName = [issueId, card_title].filter(x=> x).join(' ');;
			// github Labels may or may not be visible based on user's board configuration. Let's try to nab them..
			const tagNames = textList('ul[data-testid=card-labels] li span[class*=Text-sc]', card);

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
*/

// Project View (slideout detail panel)


// Project view (table perspective)
(async () => {
	const ScopedSingleton = function(){
		this.thread = null;
		this.pageLoadData = null;
		this.trackedRows = [];
		this.initialUrl = window.location.href;
		try {
			this.pageLoadData = JSON.parse(document.querySelector('script#memex-items-data').textContent);
			//console.debug(this.data);
		}catch{}

		this.thread = setInterval(() => {
			//console.log(Object.keys(document.querySelector('div.table-row__StyledTableRow-sc-57569b15-0')));
			if (!window.location.href.includes(this.initialUrl)) {
				console.debug('killing observer for table view due to detected url change.');
				clearInterval(this.thread);
				return;
			}

			this.trackedRows.map((row)=> {
				if (!row) return;
				if (!Object.keys(row).length) return;
				if (row.classList.includes('react-found')) return;
				row.classList.push('react-found');

				// get the hidden internal properties from react, we need details..  example: "__reactProps$b30sfm8f6q7"
				const react_props_key = Object.keys(row).find((k)=> k.startsWith('__reactProps$'));
				const react_props = row[react_props_key];
				console.log(react_props);
			});
		}, 1000);
		return this;
	}();
	
	clockifyButton.render(
		'div[data-testid=table-scroll-container] > div > div:last-child div[role="row"]:not(.clockify):not(.react-found)',
		{ observe: true },
		(row) => {
			if (!row) return;
			if (!ScopedSingleton.trackedRows.includes(row)) {
				ScopedSingleton.trackedRows.push(row);
			}
			if (Object.keys(row).length) console.log('hit');

			setTimeout(() => {
				const elementKeys = Object.keys(row);
				const reactRootKey = elementKeys.find(key => key.startsWith('__reactRoot'));
				if (reactRootKey) {
					const reactRoot = row[reactRootKey];
					console.log(reactRoot);
				}
			}, 100); // Adjust the delay as needed
			// we must wait for react to render cycle, so we can get the internal props. So we'll use our own "mutation observer".
		},
		':not(.react-found)'
	);
})();

var documents = window.getAllDocuments();
documents.forEach((document) => {
	const targetNode = document.querySelector('#memex-root');
	const config = { attributes: true, childList: true, subtree: true };
	if (!targetNode) return;
	console.log(Object.keys(targetNode));

	const callback = (mutationsList, observer) => {
		for (const mutation of mutationsList) {
			if (mutation.type === 'childList') {
				const element = mutation.target;
				const elementKeys = Object.keys(element);
				const reactRootKey = elementKeys.find(key => key.startsWith('__reactRoot'));
				if (reactRootKey) {
					const reactRoot = element[reactRootKey];
					console.log(reactRoot);
					observer.disconnect(); // Stop observing once the property is found
					break;
				}
			}
		}
	};

	const observer = new MutationObserver(callback);
	observer.observe(targetNode, config);
});