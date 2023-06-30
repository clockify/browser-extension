(async () => {
	const selectors = await getSelectors('pipefy', 'cardModalView');

	clockifyButton.render(
		selectors.hanger,
		{ observe: true },
		async (modalTitleWrapper) => {
			const selectors = await getSelectors('pipefy', 'cardModalView');

			const description = $(
				selectors.description,
				modalTitleWrapper
			).textContent;

			const link = clockifyButton.createButton({ description });

			link.style.position = 'relative';
			link.style.fontSize = '16px';
			link.style.marginTop = '16px';

			modalTitleWrapper.append(link);
		}
	);
})();
