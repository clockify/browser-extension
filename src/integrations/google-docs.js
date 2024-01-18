setTimeout(() => {
	clockifyButton.render(
		'.docs-titlebar-buttons:not(.clockify)',
		{ observe: true },
		async (elem) => {
			if ($('.clockifyButton', elem)) return;

			const title = text('.docs-title-input-label-inner');

			const description = {
				description: title,
			};

			const button = clockifyButton.createButton(description);

			const inputForm = clockifyButton.createInput(description);

			inputForm.style.marginRight = '15px';

			elem.prepend(button);
			elem.prepend(inputForm);
		}
	);
}, 1000);
