(async () => {
	clockifyButton.render(
		'.navbar-top-name',
		{ observe: false },
		async (elem) => {

			const container = $('.navbar-top-name .change-client');
			const tenantCode = $('.navbar-top-name>span').textContent;


			const description = `[${tenantCode}] `;

			const link = clockifyButton.createButton({
				description,
				projectName: 'SUP - Supporto Telefonico' ,
				taskName: 'Generico',
				small: false,
			});
			container.append(link);
		}
	);
})();
