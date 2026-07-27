(function () {
	'use strict';

	const ISSUE_ID_EXACT = /^[A-Za-z][A-Za-z0-9]*-\d+$/;
	const ISSUE_ID_IN_ROUTE = /\/issue\/([A-Za-z][A-Za-z0-9]*-\d+)/i;
	const ISSUE_QUERY_PARAMS = ['issue', 'preview', 'selectedIssue', 'peek'];
	const ISSUE_WRAPPER = '[role="dialog"], aside, main';

	// Status is the only detail button with an SVG circle on an open issue.
	clockifyButton.render(
		'[data-detail-button]:has(svg circle):not(.clockify)',
		{ observe: true, onNavigationRerender: true },
		statusControl => {
			const container = getIssueContainer(statusControl);

			if ($('.clockify-widget-container', container)) return;

			const description = () => buildDescription(statusControl);
			const link = clockifyButton.createButton({
				description,
				projectName: () => getProjectName(statusControl),
				taskName: description,
				tagNames: () => getLabels(statusControl),
			});

			injectButton(statusControl, link);
		}
	);

	applyStyles(
		`.clockify-widget-container {
			display: inline-flex;
			align-items: center;
			padding-left: 6px;
		}
		.clockify-widget-container .clockify-button-inactive {
			color: var(--color-text-primary, #444) !important;
		}
		.clockify-integration-popup input {
			color: #333 !important;
		}`,
		'clockify-linear-styles'
	);

	function buildDescription(anchor) {
		const container = getIssueContainer(anchor);
		const issueId = getIssueId();
		const title = getIssueTitle(container, issueId);

		if (issueId && title) return `[${issueId}] ${title}`;
		if (issueId) return `[${issueId}]`;

		return title || 'Linear issue';
	}

	function getIssueId() {
		const { pathname, search } = window.location;

		const fromRoute = pathname.match(ISSUE_ID_IN_ROUTE);
		if (fromRoute) return fromRoute[1].toUpperCase();

		const params = new URLSearchParams(search);
		for (const key of ISSUE_QUERY_PARAMS) {
			const value = params.get(key);
			if (value && ISSUE_ID_EXACT.test(value)) return value.toUpperCase();
		}

		return '';
	}

	function getIssueTitle(container, issueId) {
		const raw = text('[aria-label="Issue title"]', container) || titleFromDocument();

		return cleanTitle(raw, issueId);
	}

	function titleFromDocument() {
		const stripped = document.title.replace(/\s*[|\-–—]\s*Linear\s*$/i, '').trim();

		return stripped || document.title.trim();
	}

	function cleanTitle(title, issueId) {
		if (!title) return '';

		const idPattern = issueId
			? issueId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
			: '[A-Za-z][A-Za-z0-9]*-\\d+';

		return title.replace(new RegExp(`^\\[?(?:${idPattern})(?![A-Za-z0-9])\\]?[\\s:.\\-–—]*`, 'i'), '').trim();
	}

	function getProjectName(anchor) {
		const container = getIssueContainer(anchor);
		const link = $('a[href*="/project/"]:has(svg[aria-label="Open project"])', container);
		const name = link && text('[data-detail-button]', link.parentElement);

		return name || getTeamName();
	}

	function getTeamName() {
		const match = getIssueId().match(/^([A-Za-z][A-Za-z0-9]*)-\d+$/);
		const key = match && match[1].toUpperCase();
		if (!key) return '';

		return text(`a[href*="/team/${key}/overview"]`, document) || key;
	}

	function getLabels(anchor) {
		const container = getIssueContainer(anchor);
		const control = $('[aria-label="Change or add labels"]', container);
		if (!control) return undefined;

		const names = textList('span', control);

		return names.length ? names : undefined;
	}

	function getIssueContainer(anchor) {
		return anchor.closest(ISSUE_WRAPPER) || anchor.parentElement || document.body;
	}

	function injectButton(anchor, link) {
		// Keep this out of the status hover zone.
		const container = createTag('div', 'clockify-widget-container');
		container.append(link);

		let group = anchor.parentElement;
		while (group && group.querySelectorAll('[data-detail-button]').length < 2) {
			group = group.parentElement;
		}

		(group || anchor.parentElement).append(container);
	}
})();
