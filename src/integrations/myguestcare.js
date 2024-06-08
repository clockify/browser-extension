(async () => {
	clockifyButton.render(
		'.navbar-top-name',
		{ observe: false },
		async (elem) => {

			const container = $('.navbar-top-name>span');// elem.querySelector('.navbar-top-name');
			const tenantCode = $('.navbar-top-name>span').textContent;


			const description = `[${tenantCode}] `;

			const link = clockifyButton.createButton({
				description,
				projectName: 'SUP - Supporto Telefonico' ,
				taskName: 'Generico',
				small: true,
			});
			container.appendChild(link);
})();
