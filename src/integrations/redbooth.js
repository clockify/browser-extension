(async () => {
	const selectors = await getSelectors(
		'redbooth',
		'ModalWindowAndRightSidePanel'
	);

	// Modal window & Right side panel
	clockifyButton.render(selectors.hanger, { observe: true }, async (elem) => {
		$('.clockify-widget-container')?.remove();

		const description = () => $(selectors.description, elem).textContent;

		const container = createTag('div', 'clockify-widget-container');

		const link = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });

		container.style.margin = '15px 10px 0 5px';
		container.style.display = 'flex';
		container.style.alignItems = 'center';

		link.style.marginRight = '15px';

		container.append(link);
		container.append(input);

		elem.append(container);

		addCustomCss();
	});

	function addCustomCss() {
		$('.clockify-custom-css')?.remove();

		const css = `
			.clockify-integration-popup .edit-form-billable {
				width: fit-content !important;
    			position: inherit !important;
			}

			.clockify-manual-entry-header-text {
				color: #c6d2d9;
			}
		`;

		const style = createTag('style', 'clockify-custom-css', css);

		document.head.append(style);
	}
})();
