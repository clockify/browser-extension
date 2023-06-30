// Issues and filter
clockifyButton.render(
	'div.sc-cHGsZl.dsUthb > div > div#jira-issue-header:not(.clockify)',
	{ observe: true },
	(elem) => {
		if (document.getElementById('clockifyButton')) {
			document.getElementById('clockifyButton').remove();
		}
		project = $(
			'div.sc-gkFcWv.ctpjcE > div.sc-dRFtgE.iUBFPc > div > div.sc-cIShpX.ScNUs > div > div:nth-child(2) > a > span > span'
		).textContent;
		ticketId = $(
			'div.sc-cHGsZl.dsUthb > div > div#jira-issue-header > div > div > div > div > div > div:nth-child(1) > div > div > div > div > div.BreadcrumbsItem__BreadcrumbsItemElement-sc-1hh8yo5-0.fItpNE > a > span > span'
		).textContent;
		link = clockifyButton.createButton({
			description: document.title.replace(' - Jira', ''),
			projectName: project,
			taskName: ticketId,
		});
		link.style.position = 'relative';
		link.style.padding = '6px 10px 7px 20px';
		link.style.marginLeft = '10px';
		link.style.verticalAlign = 'top';
		link.style.lineHeight = '30px';

		elem.appendChild(link);
	}
);

if (document.getElementById('issue-content')) {
	document.getElementById('issue-content').classList.remove('clockify');

	if (document.getElementById('clockifyButton')) {
		document.getElementById('clockifyButton').remove();
	}
}

// Modal
clockifyButton.render(
	'.css-vfoyut #jira-issue-header [data-test-id="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		if (document.getElementById('clockifyButton')) {
			document.getElementById('clockifyButton').remove();
		}
		const root = elem.closest('div[role="dialog"]');
		const page = elem.closest('div[id="page"]');
		const issueNumber = window.location.href.match(
			/selectedIssue=(.*?)(&|$)/
		)[1];
		const desc = $('h1', root).textContent;

		let project = $('div[role="presentation"] > button', page);
		if (project) {
			project = project.childNodes[1].childNodes[0].textContent;
		} else {
			project = '';
		}
		(tags = () => Array.from($$('a.iHqNYf')).map((e) => e.innerText)),
		(link = clockifyButton.createButton({
			description: '[' + issueNumber + '] ' + desc,
			projectName: project,
			taskName: issueNumber,
			tagNames: tags,
		}));
		inputForm = clockifyButton.createInput({
			description: '[' + issueNumber + '] ' + desc,
			projectName: project,
			taskName: issueNumber,
			tagNames: tags,
		});
		link.style.position = 'relative';
		link.style.padding = '6px 0 0 20px';
		elem.appendChild(link);
		elem.appendChild(inputForm);
		$('.clockify-input').style.marginLeft = '10px';
	}
);

// One issue fullscreen
clockifyButton.render(
	'div[id="jira-frontend"] > div > div > div > div:last-child:not(.clockify)',
	{ observe: true },
	(elem) => {
		const page = elem.closest('div[id="page"]');
		const container = $(
			'div > div > div > div > div > div > div[id="jira-issue-header"] ' +
				'> div > div > div > div > div > div:first-child > div > div',
			elem
		);
		const issueNumber = window.location.href.match(/browse\/(.*?)(&|$)/)[1];
		const descElement = $('div[id="jira-issue-header"]', elem).parentNode;
		const desc = $('h1', descElement).textContent;

		// Try to find the project
		let project = $('div[role="presentation"] > button', page);
		if (project) {
			project = project.childNodes[1].childNodes[0].textContent;
		} else {
			project = '';
		}
		tags = () => Array.from($$('a.iHqNYf')).map((e) => e.innerText);

		link = clockifyButton.createButton({
			description: '[' + issueNumber + '] ' + desc,
			projectName: project,
			taskName: issueNumber,
			tagNames: tags,
		});
		link.style.position = 'relative';
		link.style.padding = '6px 0 0 20px';

		container.appendChild(link);

		inputForm = clockifyButton.createInput({
			description: '[' + issueNumber + '] ' + desc,
			projectName: project,
			taskName: issueNumber,
			tagNames: tags,
		});
		container.appendChild(inputForm);
		$('.clockify-input').style.marginLeft = '10px';
	}
);

//Issues and filter(browse one issue) - old view
clockifyButton.render(
	'div[id="issue-content"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		if (document.getElementById('clockifyButton')) {
			document.getElementById('clockifyButton').remove();
		}

		const page = elem.closest('div[id="page"]');
		const container = $(
			'div[id="jira-issue-header"] > div > div > div > div > div > div:first-child > div > div',
			elem
		);
		const issueNumber = $('a > span > span', container.lastChild).textContent;
		const desc = $('h1', elem).textContent;

		// Try to find the project
		let project = $('div[role="presentation"] > button', page);
		if (project) {
			project = project.childNodes[1].childNodes[0].textContent;
		} else {
			project = '';
		}

		const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);
		link.style.position = 'relative';
		link.style.padding = '6px 0 0 20px';

		container.appendChild(link);
	}
);

if (document.getElementById('jira-issue-header')) {
	document.getElementById('jira-issue-header').classList.remove('clockify');

	if (document.getElementById('clockifySmallButton')) {
		document.getElementById('clockifySmallButton').remove();
	}
}

//Scrum board(backlog) - detail view
clockifyButton.render(
	'div[id="ghx-detail-view"] > div > div:last-child > div > div > div > div[id="jira-issue-header"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		const page = elem.closest('div[id="page"]');
		const root = $('div[id="ghx-detail-view"]');
		const container = $(
			'div[id="jira-issue-header"] > div > div > div > div > div > div:first-child > div > div',
			elem
		);
		const issueNumber = $(
			'div > div:last-child > div > div > a > span > span',
			container.lastChild
		).textContent;
		const desc = $('h1', root).textContent;

		// Try to find the project
		let project = $('div[role="presentation"] > button', page);
		if (project) {
			project = project.childNodes[1].childNodes[0].textContent;
		} else {
			project = '';
		}

		const link = clockifyButton.createSmallButton(
			issueNumber + ' ' + desc,
			project
		);
		link.style.position = 'relative';
		link.style.padding = '0 0 0 20px';

		container.appendChild(link);
	}
);

// Confluence
setTimeout(() => {
	clockifyButton.render(
		'#content-header-container:not(.clockify)',
		{ observe: true },
		(elem) => {
			let link,
				container = createTag('div', 'button-link notion-tb-wrapper'),
				clockifyButtonLoc = $('[data-test-id="content-buttons"]');
			if (document.getElementById('clockifyButton')) {
				document.getElementById('clockifyButton').remove();
			}
			link = clockifyButton.createButton(document.title);
			link.style.cursor = 'pointer';
			container.appendChild(link);
			clockifyButtonLoc.parentElement.parentNode.firstChild.before(container);
		}
	);
}, 1000);
