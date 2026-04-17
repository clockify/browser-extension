const PLANE_ISSUE_DETAIL_CONTAINERS = [
	'.flex.flex-col.gap-5 > .flex.items-center.justify-between.gap-4.h-6',
	'.flex.items-center.justify-between.gap-4.h-6',
	'.space-y-4 > .flex.items-center.justify-between.gap-2.min-h-7',
	'.flex.items-center.justify-between.gap-2.min-h-7',
	'[data-testid="issue-detail-header"]',
	'[data-testid="issue-header"]',
	'[data-testid="issue-header-actions"]',
	'[data-testid="issue-detail-toolbar"]',
	'[data-testid="issue-title"]',
	'[data-testid="issue-modal-header"]',
	'textarea#title-input',
	'h1',
];

const PLANE_ISSUE_CARD_SELECTORS =
	'[id^="issue-"]:not(.clockify), [data-testid*="issue-card"]:not(.clockify), [data-testid*="issue-list-item"]:not(.clockify), [data-testid*="issue-row"]:not(.clockify), [data-issue-id]:not(.clockify)';

const PLANE_ISSUE_DETAIL_SELECTORS =
	'.flex.items-center.justify-between.gap-4.h-6:not(.clockify), .flex.items-center.justify-between.gap-2.min-h-7:not(.clockify), [data-testid="issue-detail-header"]:not(.clockify), [data-testid="issue-header"]:not(.clockify), [data-testid="issue-header-actions"]:not(.clockify), [data-testid="issue-detail-toolbar"]:not(.clockify), [data-testid="issue-modal-header"]:not(.clockify), [role="dialog"] .space-y-4:not(.clockify), textarea#title-input:not(.clockify), button.whitespace-nowrap.text-caption-md-medium.text-tertiary.cursor-pointer:not(.clockify), button.whitespace-nowrap.text-caption-sm-regular.text-tertiary.cursor-pointer:not(.clockify)';

clockifyButton.render(
	PLANE_ISSUE_DETAIL_SELECTORS,
	{ observe: true, onNavigationRerender: true },
	context => {
		if (!isIssueContext()) return;
		const searchRoot = resolveSearchRoot(context);

		const container = findIssueDetailContainer(searchRoot) || findIssueDetailContainer(document);
		if (!container || $('.clockify-plane-widget-container', container)) return;
		const placementTarget = getDetailPlacementTarget(container);
		if (!placementTarget || $('.clockify-plane-widget-container', placementTarget)) return;
		const entryContext = resolveDetailEntryContext(container);

		const entry = getEntryFromIssueContext(entryContext);
		if (!entry.description) return;

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const widgetContainer = createTag('div', 'clockify-plane-widget-container');
		widgetContainer.classList.add('clockify-plane-detail-widget');
		widgetContainer.append(timer);
		widgetContainer.append(input);

		placementTarget.append(widgetContainer);
	}
);

clockifyButton.render(
	PLANE_ISSUE_CARD_SELECTORS,
	{ observe: true, onNavigationRerender: true },
	cardElement => {
		const card = getCardRoot(cardElement);
		if (!card || $('.clockifyButton, .clockify-plane-card-timer', card)) return;

		const entry = getEntryFromIssueContext(card);
		if (!entry.description) return;

		const timer = clockifyButton.createTimer({
			...entry,
			small: true,
		});

		timer.classList.add('clockify-plane-card-timer');

		const placementTarget =
			firstExisting(
				[
					'.relative > .flex.shrink-0.items-center.space-x-1',
					'.relative .flex.shrink-0.items-center.space-x-1',
					'.flex.shrink-0.items-center.space-x-1',
					'[data-testid*="issue-card-actions"]',
					'[data-testid*="issue-actions"]',
					'[data-testid*="card-actions"]',
				],
				card
			) || card;

		placementTarget.appendChild(timer);
	}
);

applyStyles(
	`
	.clockify-plane-widget-container {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: 12px;
	}

	.clockify-plane-widget-container #clockify-manual-input-form input {
		width: 110px;
	}

	.clockify-plane-detail-widget {
		margin-left: 0;
	}

	.clockify-plane-card-timer {
		margin-left: 8px;
	}
`,
	'clockify-plane-styles'
);

function getEntryFromIssueContext(context = document) {
	const issueKeyFromCard = extractIssueKeyFromCard(context);
	const workspaceFromCard = extractWorkspaceFromCardLink(context);

	const issueTitle =
		firstInputValue(['textarea#title-input'], context) ||
		firstText(
			[
				'.w-full.text-body-sm-medium span',
				'.text-body-sm-medium span',
				'[data-testid="issue-title"]',
				'[data-testid*="issue-title"]',
				'h1',
				'h2',
			],
			context
		) ||
		extractIssueTitleFromDocumentTitle() ||
		'';

	const issueKey =
		issueKeyFromCard ||
		firstText(
			[
				'button.text-caption-md-medium.text-tertiary',
				'button.text-caption-sm-regular.text-tertiary',
				'[data-testid="issue-id"]',
				'[data-testid*="issue-id"]',
				'[data-testid*="issue-key"]',
				'[data-issue-id]',
			],
			context
		) ||
		extractIssueKeyFromUrl();

	const { workspaceName, projectName: projectFromUrl } = extractWorkspaceAndProjectFromUrl();

	const projectName =
		firstText(
			[
				'[data-testid="project-name"]',
				'[data-testid*="project-name"]',
				'[data-testid="project-breadcrumb"]',
				'[data-testid*="project-breadcrumb"]',
			],
			context
		) ||
		extractProjectKeyFromIssueKey(issueKey) ||
		projectFromUrl;

	const resolvedWorkspaceName = workspaceFromCard || workspaceName;

	const description = buildDescription(issueTitle, issueKey);
	const taskName = buildClockifyTaskName(issueTitle, issueKey);

	return {
		description,
		projectName,
		taskName,
	};
}

function getCardRoot(element) {
	if (!element) return null;

	if (element.id?.startsWith('issue-')) return element;

	return element.closest('[id^="issue-"]') || element;
}

function extractIssueKeyFromCard(context = document) {
	const browseLink = $('[href*="/browse/"]', context);
	const href = browseLink?.getAttribute('href') || '';
	const match = href.match(/\/browse\/([A-Z]+-\d+)\//i);

	if (match?.[1]) return match[1].toUpperCase();

	const keyCandidate =
		text('button.whitespace-nowrap.text-caption-sm-regular.text-tertiary', context) ||
		text('button.whitespace-nowrap.text-caption-md-medium.text-tertiary', context) ||
		text('button.text-caption-md-medium.text-tertiary', context);
	if (/^[A-Z]+-\d+$/i.test(keyCandidate || '')) {
		return keyCandidate.toUpperCase();
	}

	return '';
}

function extractWorkspaceFromCardLink(context = document) {
	const browseLink = $('[href*="/browse/"]', context);
	const href = browseLink?.getAttribute('href') || '';

	if (!href) return '';

	const match = href.match(/^\/([^/]+)\/browse\//);
	return match?.[1] ? titleizeSlug(match[1]) : '';
}

function extractProjectKeyFromIssueKey(issueKey) {
	if (!issueKey) return '';

	const [projectKey] = issueKey.split('-');
	return projectKey || '';
}

function buildDescription(issueTitle, issueKey) {
	if (issueKey && issueTitle) return `${issueKey} - ${issueTitle}`;
	if (issueKey) return issueKey;
	if (issueTitle) return issueTitle;
	return '';
}

function buildClockifyTaskName(issueTitle, issueKey) {
	if (issueKey && issueTitle) return `${issueKey} - ${issueTitle}`;
	if (issueKey) return issueKey;
	return issueTitle || '';
}

function findIssueDetailContainer(context = document) {
	const closestDetailContainer = getClosestDetailContainer(context);
	if (closestDetailContainer) return closestDetailContainer;

	const drawerToolbar = getDrawerToolbarContainer(context);
	if (drawerToolbar) return drawerToolbar;

	const detailContainer = firstExisting(PLANE_ISSUE_DETAIL_CONTAINERS, context);
	if (!detailContainer) return null;

	if (detailContainer.matches?.('textarea#title-input')) {
		return detailContainer.closest('.space-y-4') || detailContainer.parentElement || detailContainer;
	}

	return detailContainer;
}

function isIssueContext() {
	return (
		/\/issues\//.test(window.location.pathname) ||
		/\/browse\/[A-Z]+-\d+\/?$/i.test(window.location.pathname) ||
		!!$('[data-testid*="issue"]') ||
		!!$('textarea#title-input') ||
		!!$('[id^="issue-"]') ||
		!!$('button.text-caption-md-medium.text-tertiary') ||
		!!$('button.text-caption-sm-regular.text-tertiary')
	);
}

function extractIssueTitleFromDocumentTitle() {
	const title = document.title || '';
	return title.replace(/\s*\|\s*Plane\s*$/i, '').trim();
}

function extractIssueKeyFromUrl() {
	const pathSegments = window.location.pathname.split('/').filter(Boolean);
	const browseIndex = pathSegments.indexOf('browse');
	const issueIndex = pathSegments.indexOf('issues');

	if (browseIndex >= 0 && pathSegments[browseIndex + 1]) {
		return normalizeIssueId(pathSegments[browseIndex + 1]);
	}

	if (issueIndex >= 0 && pathSegments[issueIndex + 1]) {
		return normalizeIssueId(pathSegments[issueIndex + 1]);
	}

	const keyMatch = window.location.pathname.match(/[A-Z]+-\d+/);
	return keyMatch ? keyMatch[0] : '';
}

function extractWorkspaceAndProjectFromUrl() {
	const pathSegments = window.location.pathname.split('/').filter(Boolean);
	const workspaceIndex = pathSegments.indexOf('workspaces');
	const projectIndex = pathSegments.indexOf('projects');
	const browseIndex = pathSegments.indexOf('browse');

	const workspaceRaw =
		workspaceIndex >= 0 && pathSegments[workspaceIndex + 1]
			? pathSegments[workspaceIndex + 1]
			: pathSegments[0] || '';

	const issueFromBrowse =
		browseIndex >= 0 && pathSegments[browseIndex + 1] ? normalizeIssueId(pathSegments[browseIndex + 1]) : '';
	const projectFromIssue = extractProjectKeyFromIssueKey(issueFromBrowse);

	const projectRaw =
		projectIndex >= 0 && pathSegments[projectIndex + 1]
			? pathSegments[projectIndex + 1]
			: projectFromIssue || '';

	return {
		workspaceName: titleizeSlug(workspaceRaw),
		projectName: titleizeSlug(projectRaw),
	};
}

function normalizeIssueId(issueId) {
	return decodeURIComponent(issueId).replace(/\/.*$/, '').trim();
}

function titleizeSlug(value) {
	if (!value) return '';

	return decodeURIComponent(value)
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, char => char.toUpperCase())
		.trim();
}

function firstExisting(selectors, context = document) {
	for (const selector of selectors) {
		const foundElement = querySelfOrDescendant(selector, context);
		if (foundElement) return foundElement;
	}

	return null;
}

function firstText(selectors, context = document) {
	for (const selector of selectors) {
		const foundText = text(selector, context);
		if (foundText) return foundText;
	}

	return '';
}

function firstInputValue(selectors, context = document) {
	for (const selector of selectors) {
		const inputElement = $(selector, context);
		const foundValue = inputElement?.value?.trim();
		if (foundValue) return foundValue;
	}

	return '';
}

function getDrawerToolbarContainer(context = document) {
	const drawerRoot =
		$('textarea#title-input', context)?.closest('.space-y-4') ||
		$('textarea#title-input', context)?.closest('.flex.flex-col.gap-4.w-full.py-6') ||
		$('textarea#title-input', context)?.closest('.flex.flex-col.gap-4') ||
		$('textarea#title-input', context)?.closest('.flex.flex-col') ||
		$('textarea#title-input')?.closest('.space-y-4');

	if (!drawerRoot) return null;

	return (
		$('.space-y-4 > .flex.items-center.justify-between.gap-2.min-h-7', drawerRoot) ||
		$('.flex.items-center.justify-between.gap-2.min-h-7', drawerRoot) ||
		drawerRoot
	);
}

function getDetailPlacementTarget(container) {
	if (!container) return null;

	const keyButton = firstExisting(
		[
			'button.whitespace-nowrap.text-caption-md-medium.text-tertiary.cursor-pointer',
			'button.whitespace-nowrap.text-caption-sm-regular.text-tertiary.cursor-pointer',
		],
		container
	);

	if (keyButton?.parentElement) return keyButton.parentElement;

	const rightSideTarget =
		firstExisting(
			[
				':scope > .flex.items-center.gap-3',
				':scope > .flex.items-center.gap-x-2',
				':scope > .shrink-0',
			],
			container
		) ||
		firstExisting(
			[
				'.flex.items-center.gap-3',
				'.flex.items-center.gap-x-2',
				'.shrink-0',
			],
			container
		);

	if (rightSideTarget) return rightSideTarget;

	const leftKeyRowTarget = firstExisting(
		[
			':scope > .flex.items-center.gap-1\.5.text-body-xs-medium.min-h-6',
			'.flex.items-center.gap-1\.5.text-body-xs-medium.min-h-6',
			'.group.flex.items-center.gap-3.cursor-pointer',
		],
		container
	);

	return leftKeyRowTarget || container;
}

function resolveDetailEntryContext(container) {
	if (!container) return document;

	return (
		container.closest('.space-y-4') ||
		container.closest('.flex.flex-col.gap-4.w-full.py-6') ||
		container.closest('.flex.flex-col.gap-4') ||
		container.closest('.flex.flex-col.gap-5') ||
		container.closest('[role="dialog"]') ||
		document
	);
}

function resolveSearchRoot(context) {
	if (context instanceof Element) {
		return context;
	}

	return document;
}

function getClosestDetailContainer(context) {
	if (!(context instanceof Element)) return null;

	return context.closest(
		'.flex.items-center.justify-between.gap-4.h-6, .flex.items-center.justify-between.gap-2.min-h-7, [data-testid="issue-detail-header"], [data-testid="issue-header"], [data-testid="issue-header-actions"], [data-testid="issue-detail-toolbar"], [data-testid="issue-modal-header"], .space-y-4, .flex.flex-col.gap-5, .flex.flex-col.gap-4.w-full.py-6, .flex.flex-col.gap-4'
	);
}

function querySelfOrDescendant(selector, context = document) {
	if (context instanceof Element && context.matches(selector)) {
		return context;
	}

	return $(selector, context);
}
