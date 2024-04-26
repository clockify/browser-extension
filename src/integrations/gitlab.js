(async () => {
	addCustomCSS();

	const selectors = await getSelectors('gitlab', 'MergeRequestAndIssueView');

	// Issue view & Merge Request view
	clockifyButton.render(selectors.hanger, { observe: true }, () => {
		const breadcrumbs = $(selectors.breadcrumbs);
		const breadcrumbsList = Array.from($$('li', breadcrumbs));

		const lastBreadcrumbItemIndex = breadcrumbsList.length - 1;
		const thirdToLastBreadcrumbItemIndex = breadcrumbsList.length - 3;

		const groupBreadcrumb = breadcrumbsList[0];
		const projectBreadcrumb = breadcrumbsList[thirdToLastBreadcrumbItemIndex];
		const idBreadcrumb = breadcrumbsList[lastBreadcrumbItemIndex];

		const groupName =
			$(selectors.groupName, groupBreadcrumb)?.textContent?.trim() ||
			$(selectors.anchor, groupBreadcrumb)?.textContent?.trim();
		const id = $(selectors.id, idBreadcrumb).textContent.trim();
		const title = () => $(selectors.issueTitle).textContent.trim();
		const labels = () => Array.from($$(selectors.label));
		const labelsFormated = () =>
			labels().map((label) => {
				const firstSpan = $(selectors.firstSpan, label)?.textContent?.trim();
				const secondSpan = $(selectors.secondSpan, label)?.textContent?.trim();

				const isLabelScoped = !!secondSpan;

				return isLabelScoped ? `${firstSpan}:${secondSpan}` : firstSpan;
			});

		const projectName = projectBreadcrumb.textContent.trim();

		const description = () => `${groupName}/${projectName}${id} ${title()}`;
		const taskName = () => `${id} ${title()}`;
		const tagNames = () => [...new Set(labelsFormated())];

		const clockifyContainer = createTag('div', 'clockify-widget-container');

		const entryOptions = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(entryOptions);
		const input = clockifyButton.createInput(entryOptions);

		clockifyContainer.append(link);
		clockifyContainer.append(input);

		breadcrumbs.append(clockifyContainer);

		console.log(projectName);
	});

	function addCustomCSS() {
		const isCustomStyleAdded = $('.clockify-custom-css');

		if (isCustomStyleAdded) return;

		const customCSS = `
			#clockifyButton {
				display: flex;
				align-items: flex-start !important;
				margin: 0 7px;
			}

			#clockify-manual-input-form {
				margin-right: 7px;
			}

			.breadcrumbs, .clockify-widget-container {
				display: flex;
				align-items: center;
				justify-content: space-between;
			}
			
			.top-bar-fixed {
				width: auto !important;
			}
		`;

		const style = createTag('style', 'clockify-custom-css', customCSS);

		document.head.append(style);
	}
})();
