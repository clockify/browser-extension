// Linear's markup makes is pretty hard to identify and target things, so we have to rely on URLs and fragile relational selectors.
// The code here is written with an emphasis on readability and maintainability over performance and size, because it will likely need to be updated frequently.

console.log('hello?');
clockifyButton.render(
	'main:not(.clockify)',
	{ observe: true },
	(elem) => {
		const root = $('div[id="root"]');

		// First, check if the current page is an issue, team, or project page and call the appropriate rendering function.

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
		}
		// TODO: Add buttons on team and project pages.
		// Ran into some problems because the issue line items are mutated as the user scrolls, which removes the buttons.
	}
);

//
//
// Render the Clockify button on an issue page.
//
function renderIssueButton(elem) {
	const container = elem.childNodes[1].firstChild.childNodes[1].firstChild.childNodes[1]; // gross
	const htmlTag = createTag('div', 'clockify-button-wrapper');

	const description = document.title;

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

	const project = linearProject;

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
