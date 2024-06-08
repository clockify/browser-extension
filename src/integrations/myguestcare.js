(async () => {
	clockifyButton.render(
		'.navbar-top-name',
		{ observe: false },
		async (elem) => {
			const container = $('.navbar-top-name .change-client');
			const tenantCode = $('.navbar-top-name>span').textContent;

			const defaults = {
				small: false,
				...JSON.parse( (await localStorage.getItem('clockify_defaults')) || '{}'),
				...JSON.parse( (await sessionStorage.getItem('clockify_defaults')) || '{}'),
			};

			const description = `[${tenantCode}] `;

			const link = clockifyButton.createButton({
				description,
				projectName: defaults.projectName,
				taskName: defaults.taskName,
				small: defaults.small,
			});
			container.append(link);

			setTimeout( () => {
				link.title = `Project: ${defaults.projectName || 'Empty'}\nTask: ${defaults.taskName || 'Empty'}`;
			}, 1000);
		}
	);
})();
