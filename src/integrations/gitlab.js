(async () => {
	const selectors = await getSelectors('gitlab', 'MergeRequestAndIssueView');

	// Issue view & Merge Request view - old UIs and new UI
	clockifyButton.render(
		`
		[data-page="projects:issues:show"] [data-testid="breadcrumb-links"]:not(.clockify),
		[data-page="projects:merge_requests:show"] [data-testid="breadcrumb-links"]:not(.clockify)
		`,
		{ observe: true },
		() => {
			const breadcrumbs = $(selectors.breadcrumbs);
			const breadcrumbsList = Array.from($$('li', breadcrumbs));

			const lastBreadcrumbItemIndex = breadcrumbsList.length - 1;
			const thirdToLastBreadcrumbItemIndex = breadcrumbsList.length - 3;

			const groupBreadcrumb = breadcrumbsList[0];
			const projectBreadcrumb = breadcrumbsList[thirdToLastBreadcrumbItemIndex];
			const idBreadcrumb = breadcrumbsList[lastBreadcrumbItemIndex];

			const groupName =
				text(selectors.groupName, groupBreadcrumb) ||
				text(selectors.anchor, groupBreadcrumb) ||
				groupBreadcrumb?.innerText;
			const id = idBreadcrumb.innerText.trim();
			const title = () => text(selectors.issueTitle);
			const labels = () => Array.from($$(selectors.label));
			const labelsFormated = () =>
				labels().map((label) => {
					const firstSpan = text(selectors.firstSpan, label);
					const secondSpan = text(selectors.secondSpan, label);

					const isLabelScoped = !!secondSpan;

					return isLabelScoped ? `${firstSpan}:${secondSpan}` : firstSpan;
				});

			const projectName = projectBreadcrumb.textContent.trim();

			const description = () => `${groupName}/${projectName}${id} ${title()}`;
			const taskName = () => `${id} ${title()}`;
			const tagNames = () => [...new Set(labelsFormated())];

			const clockifyContainer = createTag('div', 'clockify-widget-container');

			const entry = { description, projectName, taskName, tagNames };

			const link = clockifyButton.createButton(entry);
			const input = clockifyButton.createInput(entry);

			clockifyContainer.append(link);
			clockifyContainer.append(input);

			breadcrumbs.append(clockifyContainer);
		}
	);
})();

applyStyles(`
	#clockifyButton {
		display: flex;
		align-items: flex-start !important;
		margin: 0 7px;
	}

	#clockify-manual-input-form {
		margin-right: 7px;
	}

	[aria-label*=\"Breadcrumb\"], .clockify-widget-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	
	.top-bar-fixed {
		width: auto !important;
	}
`);
