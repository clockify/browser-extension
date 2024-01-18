clockifyButton.render(
	'.ConversationDetailsView:not(.clockify)',
	{ observe: true },
	(ticketSidebar) => {
		const descriptionSelector = () => {
			const ticketCode = $('.CodeLabel').textContent.trim();
			const ticketSubject = $('.ConversationHeaderSubject').textContent.trim();
			return '[' + ticketCode + '] ' + ticketSubject;
		};

		const link = clockifyButton.createButton(descriptionSelector);
		link.style.display = 'inline-block';
		link.style.cursor = 'pointer';
		link.style.padding = '10px 20px';
		link.style.marginBottom = '1em';

		var wrapper = document.createElement('div');
		wrapper.className = 'clockifyWrapper';
		wrapper.style.textAlign = 'center';
		wrapper.style.borderBottom = '1px solid rgba(125,125,125,0.3)';
		wrapper.style.marginBottom = '1em';
		wrapper.appendChild(link);

		ticketSidebar.insertBefore(wrapper, ticketSidebar.firstChild);
	}
);

clockifyButton.render(
	'.ArticleDetails:not(.clockify)',
	{ observe: true },
	(articleDetails) => {
		const articleHeader = $('.KbTitle').textContent.trim();
		const link = clockifyButton.createButton(articleHeader);
		link.style.display = 'inline-block';
		link.style.cursor = 'pointer';
		link.style.padding = '0 20px';
		link.style.marginBottom = '1em';

		var wrapper = document.createElement('div');
		wrapper.className = 'clockifyWrapper';
		wrapper.style.textAlign = 'center';
		wrapper.style.borderBottom = '1px solid rgba(125,125,125,0.3)';
		wrapper.style.marginBottom = '1em';
		wrapper.appendChild(link);

		articleDetails.insertBefore(wrapper, articleDetails.firstChild);
	}
);
