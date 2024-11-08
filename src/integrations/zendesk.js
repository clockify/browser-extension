(async () => {
	const { singleTicketView, singleTicketViewNewUi } = await getSelectors('zendesk');

	// Single ticket view (old UI, we can propbably delete this render)
	clockifyButton.render(
		singleTicketView.hanger,
		{ observe: true, onNavigationRerender: true },
		navBar => {
			const ticketNumber = () => location.href.match(/tickets\/(\d+)/)[1];
			const ticketSubject = () => value(singleTicketView.ticketSubject);

			const description = () => `#${ticketNumber()} ${ticketSubject()}`;
			const tagNames = () => textList(singleTicketView.ticketTags);

			const timer = clockifyButton.createTimer({ description, tagNames });
			const input = clockifyButton.createInput({ description, tagNames });

			const container = createContainer(timer, input);

			navBar.append(container);
		}
	);

	// Single ticket view (new UI)
	clockifyButton.render(
		'[aria-label="Ticket page location"]:not(.clockify)',
		{ observe: true, onNavigationRerender: true },
		navBar => {
			const ticketNumber = () => location.href.match(/tickets\/(\d+)/)[1];
			const ticketSubject = () => value(singleTicketViewNewUi.ticketSubject);

			const description = () => `#${ticketNumber()} ${ticketSubject()}`;
			const tagNames = () => textList(singleTicketViewNewUi.ticketTags);

			const timer = clockifyButton.createTimer({ description, tagNames });
			const input = clockifyButton.createInput({ description, tagNames });

			const container = createContainer(timer, input);

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
