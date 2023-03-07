// Jira 2018-11 issue page. Uses functions for timer values due to SPA on issue-lists.
clockifyButton.render(
	'#jira-frontend:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link, issueNumberElement, container, titleElement, projectElement;

		issueNumberElement = $(
			'a[href^="/browse/"][target=_blank]:not([role=list-item])',
			elem
		);
		container = issueNumberElement.parentElement.parentElement.parentElement;

		function getDescription() {
			var description = '';
			titleElement = $('h1 ~ button[aria-label]', elem).previousSibling;

			if (issueNumberElement) {
				description += issueNumberElement.textContent.trim();
			}

			if (titleElement) {
				if (description) description += ' ';
				description += titleElement.textContent.trim();
			}

			return description;
		}

		link = clockifyButton.createButton(getDescription);
		link.style.position = 'relative';
		link.style.top = '-18px';

		container.appendChild(link);
	}
);
// Jira 2017 board sidebar
clockifyButton.render(
	'#ghx-detail-view [spacing] h1:not(.clockify)',
	{ observe: true },
	() => {
		var link,
			description,
			rootElem = $('#ghx-detail-view'),
			container = createTag('div', 'jira-ghx-clockify-button'),
			titleElem = $('[spacing] h1', rootElem),
			numElem = $('[spacing] a', rootElem),
			projectElem = $('.bgdPDV');

		description = titleElem.textContent;
		if (numElem !== null) {
			description = numElem.textContent + ' ' + description;
		}

		link = clockifyButton.createSmallButton(description);
		link.style.position = 'relative';
		link.style.left = '10px';

		container.appendChild(link);
		numElem.parentNode.appendChild(container);
	}
);

// Jira 2018-06 new sprint modal
// Classes are random keep changing so we need to rely on other attributes
clockifyButton.render(
	'div[role="dialog"] h1 + button[aria-label="Edit Summary"]',
	{ observe: true },
	(needle) => {
		var root = needle.closest('div[role="dialog"]'),
			id = $(
				'div:last-child > a[spacing="none"][href^="/browse/"]:last-child',
				root
			),
			description = $('h1:first-child', root),
			project = $('a[spacing="none"][href*="/projects/"]'),
			container = createTag('div', 'jira-ghx-clockify-button'),
			link;

		if (project === null) {
			project = $(
				'div[data-test-id="navigation-apps.project-switcher-v2"] button >' +
					' div:nth-child(1) > div:first-child'
			);
		}

		if (id !== null && description !== null) {
			link = clockifyButton.createButton(
				id.textContent + ' ' + description.textContent
			);
			link.style.position = 'relative';
			link.style.left = '10px';

			container.appendChild(link);
			id.parentNode.appendChild(container);
		}
	}
);

// Jira 2018-08 sprint modal
// Using the h1 as selector to make sure that it will only try to render the button
// after Jira has fully rendered the modal content
clockifyButton.render(
	'div[role="dialog"].sc-krDsej h1:not(.clockify)',
	{ observe: true },
	(needle) => {
		var root = needle.closest('div[role="dialog"]'),
			id = $('a:first-child', root),
			description = $('h1:first-child', root),
			project = $('.sc-cremA'),
			container = createTag('div', 'jira-ghx-clockify-button'),
			link;

		if (id !== null && description !== null && project !== null) {
			link = clockifyButton.createSmallButton(
				id.textContent + ' ' + description.textContent
			);

			container.appendChild(link);
			$('.sc-iBmynh', root).appendChild(container);
		}
	}
);

// Jira 2018 sprint modal
// Using the h1 as selector to make sure that it will only try to render the button
// after Jira has fully rendered the modal content
clockifyButton.render(
	'div[role="dialog"] .ffQQbf:not(.clockify)',
	{ observe: true },
	(needle) => {
		var root = needle.closest('div[role="dialog"]'),
			id = $('a:first-child', root),
			description = $('h1:first-child', root),
			project = $('.bgdPDV'),
			container = createTag('div', 'jira-ghx-clockify-button'),
			link;

		if (id !== null && description !== null && project !== null) {
			link = clockifyButton.createButton(
				id.textContent + ' ' + description.textContent
			);

			container.appendChild(link);
			id.parentNode.appendChild(container);
		}
	}
);

// Jira 2017 issue page
clockifyButton.render(
	'.issue-header-content:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description,
			numElem = $('#key-val', elem),
			titleElem = $('#summary-val', elem) || '',
			projectElem = $('.bgdPDV');

		if (!!titleElem) {
			description = titleElem.textContent.trim();
		}

		if (numElem !== null) {
			if (!!description) {
				description = ' ' + description;
			}
			description = numElem.textContent + description;
		}

		// JIRA server support
		if (projectElem === null) {
			projectElem = $('#project-name-val');
		}

		link = clockifyButton.createButton(description);

		link.style.marginLeft = '8px';

		var issueLinkContainer =
			$('.issue-link').parentElement || $('.aui-nav li').lastElementChild;
		issueLinkContainer && issueLinkContainer.appendChild(link);
	}
);

// Jira pre-2017
clockifyButton.render(
	'#ghx-detail-issue:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link,
			description,
			container = createTag('div', 'ghx-clockify-button'),
			titleElem = $('[data-field-id="summary"]', elem),
			numElem = $('.ghx-fieldname-issuekey a'),
			projectElem = $('.ghx-project', elem);

		description = titleElem.textContent;
		if (numElem !== null) {
			description = numElem.textContent + ' ' + description;
		}

		link = clockifyButton.createButton(description);

		container.appendChild(link);
		$('#ghx-detail-head').appendChild(container);
	}
);

// Jira pre-2017
clockifyButton.render(
	'.issue-header-content:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description,
			ul,
			li,
			numElem = $('#key-val', elem),
			titleElem = $('#summary-val', elem) || '',
			projectElem = $('#project-name-val', elem);

		if (!!titleElem) {
			description = titleElem.textContent;
		}

		if (numElem !== null) {
			if (!!description) {
				description = ' ' + description;
			}
			description = numElem.textContent + description;
		}

		link = clockifyButton.createButton(description);

		ul = createTag('ul', 'toolbar-group');
		li = createTag('li', 'toolbar-item');
		li.appendChild(link);
		ul.appendChild(li);
		$('.toolbar-split-left').appendChild(ul);
	}
);

//Confluence
clockifyButton.render(
	'#title-heading:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description,
			titleElem = $('[id="title-text"]', elem);

		description = titleElem.textContent.trim();

		link = clockifyButton.createButton(description);

		$('#title-text').appendChild(link);
	}
);
