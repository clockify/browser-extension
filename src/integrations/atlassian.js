setTimeout(() => {
	clockifyButton.render('#jira-issue-header [data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-current-issue-container"]:not(.clockify)', { observe: true }, (elem) => {
		if ($('#clockifyButton')) {
			$('#clockifyButton').remove();
		}

		const root = $('div[data-testid="issue-field-summary.ui.issue-field-summary-inline-edit--container"]');
		const issueNumber = window.location.href.match(/selectedIssue=(.*?)(&|$)/)?.[1];
		const description = $('h1', root)?.textContent;
		const epic = $('div[data-testid="issue.views.issue-base.foundation.breadcrumbs.breadcrumb-parent-issue-container"]')?.textContent;

		const tagNames = [issueNumber];
		const project = $('nav[aria-label="Breadcrumbs"] > ol > li:nth-child(2)')?.textContent;
		const checkobox = $('#clockifyInput');
		console.log(checkobox?.checked);

		if (issueNumber && description) {
			const record = {
				description: '[' + issueNumber + '] ' + description,
				// taskName: issueNumber, // TODO -- there could be some setting to descide if you want to create also use tasks
				tagNames,
			};

			if (project) {
				record.projectName = project;
			}

			if (epic) {
				record.tagNames.push(epic);
			}

			const button = clockifyButton.createSmallButton(record);
			const input = clockifyButton.createInput(record);
			button.style.margin = '0 10px';
			button.style.position = 'relative';
			input.style.margin = '10px';

			elem.appendChild(button);
			root.appendChild(input);
		}
	});
}, 200);
