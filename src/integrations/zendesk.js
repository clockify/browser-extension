(async () => {
	const selectors = await getSelectors('zendesk', 'singleTicketView');

	clockifyButton.render(
		selectors.hanger,
		{ observe: true, onNavigationRerender: true },
		async navBar => {
			const ticketNumber = () => location.href.match(/tickets\/(\d+)/)[1];
			const ticketSubject = () => value(selectors.ticketSubject);

			const description = () => `#${ticketNumber()} ${ticketSubject()}`;
			const tagNames = () => textList(selectors.ticketTags);

			const link = clockifyButton.createButton({ description, tagNames });
			const input = clockifyButton.createInput({ description, tagNames });

			const container = createTag('div', 'clockify-widget-container');

			container.append(link);
			container.append(input);

			navBar.append(container);
		}
	);
})();

applyStyles(`
	.clockify-widget-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 28px;
		width: 260px; 
		padding-left: 30px;
	}
`);
