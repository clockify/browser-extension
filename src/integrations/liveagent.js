clockifyButton.render(
	'.ConversationDetailsView:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	ticketSidebar => {
		const conversationId = () => text('#conversation-code-label');
		const conversationTitle = () => text('.ConversationHeaderSubject div:has(+ form) div');

		const description = () => `[${conversationId()}] ${conversationTitle()}`;

		const timer = clockifyButton.createButton({ description });

		timer.style.display = 'inline-block';
		timer.style.cursor = 'pointer';
		timer.style.padding = '10px 20px';
		timer.style.marginBottom = '1em';

		const wrapper = document.createElement('div');

		wrapper.className = 'clockifyWrapper';
		wrapper.style.textAlign = 'center';
		wrapper.style.borderBottom = '1px solid rgba(125,125,125,0.3)';
		wrapper.style.marginBottom = '1em';

		wrapper.append(timer);

		ticketSidebar.insertBefore(wrapper, ticketSidebar.firstChild);
	}
);

clockifyButton.render(
	'.ArticleDetails:not(.clockify)',
	{
		observe: true,
	},
	articleDetails => {
		const articleHeader = () => value('.TextBox[name="title"]');
		const link = clockifyButton.createButton(articleHeader);

		link.style.display = 'inline-block';
		link.style.cursor = 'pointer';
		link.style.padding = '0 20px';
		link.style.marginBottom = '1em';

		const wrapper = document.createElement('div');

		wrapper.className = 'clockifyWrapper';
		wrapper.style.textAlign = 'center';
		wrapper.style.borderBottom = '1px solid rgba(125,125,125,0.3)';
		wrapper.style.marginBottom = '1em';
		wrapper.appendChild(link);

		articleDetails.insertBefore(wrapper, articleDetails.firstChild);
	}
);
