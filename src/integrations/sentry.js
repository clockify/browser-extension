clockifyButton.render(
	`[data-sentry-element=ActionBar] [data-sentry-element=ActionWrapper]:not(.clockify), 
			 [data-sentry-element="Layout.Header"] [data-sentry-component=BaseTabList] ul:not(.clockify)
	`,
	{ observe: true },
	elem => {
		const projectNameWithId = text('[data-sentry-element=StyledShortId] span');
		let issueName =
			text('[data-sentry-element=PrimaryTitle]') ||
			text('[data-sentry-component=EventOrGroupTitle]');
		issueName =
			issueName[0] === '<' && issueName[issueName.length - 1] === '>'
				? issueName?.replace(/[<>]/g, '')
				: issueName;
		let issueDescription = text('[data-sentry-element=Message]');
		issueDescription = issueDescription ? `-${issueDescription}` : '';

		const projectName = projectNameWithId.slice(0, projectNameWithId.lastIndexOf('-'));
		const description = `#${projectNameWithId.slice(projectNameWithId.lastIndexOf('-') + 1)}: ${issueName}${issueDescription}`;

		const link = clockifyButton.createButton({ description, projectName });
		link.style.marginLeft = '10px';


		elem.appendChild(link);
	},
);

applyStyles(`
	.clockify-button-inactive-span,
	.clockify-button-active-span {
		top: ${navigator.userAgent.includes('Firefox') ? '1px' : 0};
	}
`);