clockifyButton.render(
	'[data-coda-ui-id="canvasRoot"] h1:not(.clockify)',
	{ observe: true },
	async documentTitle => {
		const description = () => {
			const documentTitle = text('h1 div:has( + textarea)');

			const isDocumentUntitled = documentTitle === 'Add page title';

			if (isDocumentUntitled) return 'Untitled document';

			return documentTitle;
		};

		const timer = clockifyButton.createButton({ description });

		timer.style.marginTop = '2rem';
		timer.style.fontWeight = '400';

		documentTitle.after(timer);
	}
);
