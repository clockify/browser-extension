(async () => {
	const selectors = await getSelectors('pipedrive');

	// Lead View
	clockifyButton.render(
		selectors.leadView.hanger,
		{ observe: true },
		async (elem) => {
			const description = () =>
				$(selectors.leadView.leadName, elem).textContent;

			const link = clockifyButton.createButton({ description });

			link.style.marginTop = '10px';

			elem.append(link);
		}
	);

	// Deal View
	clockifyButton.render(
		selectors.dealView.hanger,
		{ observe: true },
		async (elem) => {
			const description = () =>
				$(selectors.dealView.dealName, elem).textContent;

			const link = clockifyButton.createButton({ description });

			elem.style.display = 'flex';
			elem.style.alignItems = 'center';
			elem.style.justifyContent = 'space-between';

			link.style.marginLeft = '10px';

			elem.append(link);
		}
	);

	// Activity View
	clockifyButton.render(
		selectors.activityView.hanger,
		{ observe: true },
		async (elem) => {
			const description = () => $(selectors.activityView.cardTitle).textContent;

			const link = clockifyButton.createButton({ description });

			link.style.position = 'absolute';
			link.style.left = '60px';

			$('div:first-child', elem).after(link);

			const pipedriveSaveButton = $('[data-test="save-activity-button"]');

			pipedriveSaveButton.addEventListener('click', () =>
				setTimeout(() => {
					const clockifyButton = $('#clockifyButton');
					const newDescription = $(
						selectors.activityView.cardTitle
					).textContent;

					clockifyButton.setAttribute('title', newDescription);
				}, 500)
			);
		}
	);

	// Contact View
	clockifyButton.render(
		selectors.contactView.hanger,
		{ observe: true },
		async (elem) => {
			const description = () =>
				document.title.replace(' - contact details', '');

			const link = clockifyButton.createButton({ description });

			link.style.margin = '10px';

			elem.append(link);
		}
	);
})();
