clockifyButton.render(
	'.conversation-view__main [class^=conversationHeader__]:not(.clockify)',
	{ observe: true },
	function (elem) {
		const getDescription = () => {
			const csid = document.querySelector(
				'.conversation-view__main button span'
			).textContent;
			return csid;
		};

		const getTitle = () => {
			const title = document.querySelector(
				'.conversation-view__main [class^=conversationHeader__] [class^=headline__] p'
			).textContent;
			return title;
		};

		const getProject = () => {
			const subdomain = window.location.host.replace('.dixa.com', '');
			return subdomain;
		};

		const description = getDescription();
		const project = getProject();
		const title = getTitle();
		const link = clockifyButton.createButton(
			`${description} ${title} ${project} `
		);
		const host = elem.querySelector('[class^=topActions__] [class^=root__]');
		host.insertBefore(link, null);
	}
);
