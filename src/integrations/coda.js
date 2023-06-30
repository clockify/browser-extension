(async () => {
	clockifyButton.render(
		await getSelectors('coda', 'documentView', 'hanger'),
		{ observe: true },
		(elem) => {
			const isDocumentOpened = location.pathname.split('/')[1] === 'd';

			if (!isDocumentOpened) return;

			$('#clockifyButton')?.remove();

			const description = document.title;
			const link = clockifyButton.createButton({ description });

			link.style.margin = '0 15px';
			link.style.pointerEvents = 'all';

			elem.after(link);
		}
	);
})();
