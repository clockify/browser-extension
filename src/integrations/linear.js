// Linear's minified markup makes is pretty hard to target and identify things, so we have to rely on URLs and fragile selectors.
// To make it easier to keep up with Linear's changing markup, this is written with an emphasis on readability and maintainability over performance and size.
clockifyButton.render(
	'main:not(.clockify)',
	{ observe: true },
	(elem) => {
		const root = $('div[id="root"]');

		// Check if the current page is an issue, team, or project page and call the appropriate rendering function.
		const url = window.location.href;

		// Single issue pattern: linear.app/*/issue/*
		const issuePattern = /https:\/\/linear\.app\/.*\/issue\/.*/;
		const isIssue = issuePattern.test(url);

		// Team issues pattern: linear.app/*/team/*
		const teamPattern = /https:\/\/linear\.app\/.*\/team\/.*/;
		const isTeam = teamPattern.test(url);

		// Project issues pattern: linear.app/*/project/*
		const projectPattern = /https:\/\/linear\.app\/.*\/project\/.*/;
		const isProject = projectPattern.test(url);

		if (isIssue) {
			renderIssueButton(elem);
		} else if (isTeam) {
			// TODO: Implement team button
		} else if (isProject) {
			// TODO: Implement project button
		}
	}
);

// Render the Clockify button on the issue page.
function renderIssueButton(elem) {
	const container = elem.childNodes[1].firstChild.childNodes[1].firstChild.childNodes[1]; // gross
	const htmlTag = createTag('div', 'clockify-button-wrapper');

	const description = document.title;

	// For Clockify project, use Linear project name with a fallback to the team name.

	const sideBarLabels = container.querySelectorAll('& > div > div > span');
	let linearProject = '';

	// Get project name from sidebar.
	sideBarLabels.forEach((label) => {
		if (label.textContent.includes('Project')) {
			const buttonText = label.parentElement.nextSibling.querySelector('button span').textContent;

			if (buttonText && buttonText !== 'Add to project') {
				linearProject = buttonText;
			}
		}
	});

	// Get team name from header.
	// Depending on how you navigate to an issue, the project could be the first link in the header. But in that case we would use the project name from the sidebar anyway.
	const header = elem.querySelector('header');
	const linearTeam = header.querySelector('a span').textContent || '';

	const project = linearProject || linearTeam;

	const link = clockifyButton.createButton(description, project);

	htmlTag.appendChild(link);
	container.appendChild(htmlTag);

	// Add styling to the button. Using style tag because mutations.
	const styleTag = createTag('style');
	styleTag.innerHTML = `
			.clockify-button-wrapper div div {
				padding: 0.5em 1em;
				border: 1px solid rgb(223, 225, 228);
				border-radius: 4px;
				box-shadow: rgba(0, 0, 0, 0.09) 0px 1px 4px;
				margin: 1em 0;

				&:hover, &:focus {
					background-color: rgb(244, 245, 248);
					border-color: rgb(223, 225, 228);
				}
			}
		`;
	htmlTag.appendChild(styleTag);
}
