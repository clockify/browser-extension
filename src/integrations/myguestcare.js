(async () => {
	clockifyButton.render(
		'.navbar-top-name',
		{ observe: false },
		async (elem) => {
			const container = $('.navbar-top-name .change-client');
			const tenantCode = $('.navbar-top-name>span').textContent;

			const description = `[${tenantCode}] `;

			const link = clockifyButton.createButton({
				...localStorage.getItem('clockify_defaults'),
				...sessionStorage.getItem('clockify_defaults'),
				description,
				small: false,
			});
			container.append(link);
		}
	);
})();
