// Old UI (MR view & issue view) & New UIs (show MR view)
clockifyButton.render(
	`
	[data-page^="projects:issues:"] main .title-container:not(.clockify),
	[data-page^="projects:merge_requests:"] main .detail-page-header:not(.clockify)
	`,
	{ observe: true },
	async heading => {
		const labels = await waitForElement('[data-testid="sidebar-labels"]');
		const breadcrumbs = await waitForElement('[class$="breadcrumbs"]');
		const breadcrumbsList = Array.from($$('li a', breadcrumbs));
		const lastBreadcrumbText = breadcrumbsList.reverse()[0].textContent.trim();

		const isIssue = Boolean($('[data-page^="projects:issues:"]'));

		const id = () => lastBreadcrumbText.replace('#', '').replace('!', '');
		const title = () => text('h1, h2', heading);
		const group = () => attribute('data-group');
		const project = () => attribute('data-project');
		const separator = () => (isIssue ? '#' : '!');

		const description = () => `${group()}/${project()}${separator()}${id()} ${title()}`;
		const projectName = () => project();
		const taskName = () => `${id()} ${title()}`;
		const tagNames = () => extractLabels('.gl-label-link', labels);

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		heading.after(container);
	}
);

// New UIs (show issue view & sidebar issue view)
clockifyButton.render(
	'[data-page^="projects:issues:"] main div:has(> [data-testid="work-item-type"]):not(.clockify)',
	{ observe: true },
	async heading => {
		const labels = await waitForElement('[data-testid="work-item-labels"]');

		const id = () =>
			text('[data-testid="work-item-drawer-ref-link"]')?.split('#')?.reverse()?.[0] ||
			text('.breadcrumb li:last-child a span').split('#').reverse()[0];
		const title = () => text('h1, h2', heading);
		const group = () => attribute('data-group');
		const project = () => attribute('data-project');

		const description = () => `${group()}/${project()}#${id()} ${title()}`;
		const projectName = () => project();
		const taskName = () => `${id()} ${title()}`;
		const tagNames = () => extractLabels('.gl-label-link', labels);

		const entry = { description, projectName, taskName, tagNames };

		const timer = clockifyButton.createTimer(entry);
		const input = clockifyButton.createInput(entry);

		const container = createContainer(timer, input);

		heading.after(container);
	}
);

function extractLabels(selector, context) {
	const labels = Array.from($$(selector, context)).map(label => {
		const firstSpan = text('span:nth-child(1)', label);
		const secondSpan = text('span:nth-child(2)', label);

		const isLabelScoped = Boolean(secondSpan);

		return isLabelScoped ? `${firstSpan}:${secondSpan}` : firstSpan;
	});

	return [...new Set(labels)];
}

applyStyles(`
	.clockify-widget-container {
		width: 100%;
		height: 40px;
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: center;
		gap: 2rem;
	}

	input.clockify-input { 
		border-radius: 0.25rem; 
	}
`);

initializeHtmlObserver();
applyManualInputStyles();

function initializeHtmlObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const lightStyles = `
		span.clockify-button-inactive {
			color: #444444 !important;
		}

		input.clockify-input {
			color: #444444 !important;
			border: none !important;
			background: #fff !important;
			border: 1px solid #dcdcde !important;
		}
	`;
	const darkStyles = `
		span.clockify-button-inactive {
			color: #fff !important;
		}
		input.clockify-input {
			color: #fff !important;
			border: none !important;
			background: rgba(255, 255, 255, 0.16) !important;
		}
	`;

	const htmlTagClasslist = [
		...Array.from(document.documentElement.classList),
		...Array.from(document.body.classList),
	];
	const valueWithDark = htmlTagClasslist.find(attributeValue => attributeValue.includes('dark'));
	const isThemeDark = Boolean(valueWithDark);

	const stylesToApply = isThemeDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
