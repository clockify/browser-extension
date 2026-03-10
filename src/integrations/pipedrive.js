(async () => {
	const selectors = await getSelectors('pipedrive');

	// Lead View
	clockifyButton.render(selectors.leadView.hanger, { observe: true }, async elem => {
		const description = () => $(selectors.leadView.leadName, elem).textContent;

		const link = clockifyButton.createButton({ description });

		link.style.marginTop = '10px';

		elem.append(link);
	});

	// Deal View
	clockifyButton.render(selectors.dealView.hanger, { observe: true }, async elem => {
		const description = () => $(selectors.dealView.dealName, elem).textContent;

		const link = clockifyButton.createButton({ description });

		elem.style.display = 'flex';
		elem.style.alignItems = 'center';
		elem.style.justifyContent = 'space-between';

		link.style.marginLeft = '10px';

		elem.append(link);
	});

	// Activity View
	clockifyButton.render(selectors.activityView.hanger, { observe: true }, async elem => {
		const description = () =>
			value(selectors.activityView.cardTitle) || value(selectors.activityView.cardTitle2);

		const link = clockifyButton.createButton({ description });

		window.addEventListener('resize', () => {
			document.querySelector('#clockifyButton').style.marginLeft =
				window.innerWidth < 1600 ? '10px' : '105px';
		});

		link.style.marginLeft = window.innerWidth < 1600 ? '10px' : '105px';
		link.style.marginTop = '5px';

		elem.append(link);
	});

	// Contact View
	clockifyButton.render(selectors.contactView.hanger, { observe: true }, async elem => {
		const description = () => document.title.replace(' - contact details', '');

		const link = clockifyButton.createButton({ description });

		link.style.margin = '10px';

		elem.append(link);
	});
})();
