clockifyButton.render(
	'[aria-label="Set issue status…"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		// We'll extract the data via the path since Linear app uses an excessive minification strategy.
		const pathArray = window.location.pathname.split('/');
		// const issueId = pathArray[3];
		const description = document.title;
		// Normalize the project id.
		const project = pathArray[1]
			.replace(/-/g, ' ')
			.toLowerCase()
			.replace(/(^|\s)\S/g, (L) => L.toUpperCase());

		const link = clockifyButton.createButton({
			description: description,
			projectName: project,
			taskName: description,
		});

		const getThirdParent = (e) => {
			let parent = e;

			for (let i = 0; i < 3; i++) {
				parent = parent.parentElement;
			}

			return parent;
		};

		const thirdParent = getThirdParent(elem);

		if (getComputedStyle(thirdParent).display !== 'flex')
			thirdParent.append(link);
	}
);
