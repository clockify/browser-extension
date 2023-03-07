clockifyButton.render(
	'.conversationTopbar__StyledConversationTopbar-sc-denlcl-0:not(.clockify)',
	{ observe: true },
	(elem) => {
		const titleSelector = $(
			'.conversationSubjectWrapper__StyledSubjectContainerDiv-sc-1xaczhh-0 > div > span'
		);
		const recipientSelector = $(
			'.messageViewerRecipient__StyledDetailsWrapperDiv-sc-1z03g13-1 div'
		);
		const title = titleSelector ? titleSelector.textContent : null;
		const recipient = recipientSelector ? recipientSelector.textContent : null;
		const taskName = '[Ticket] ' + title + ' - ' + recipient;
		const container = $('.conversationTopbar__StyledContentDiv-sc-denlcl-1');
		const description = taskName;

		const link = clockifyButton.createButton({
			description,
			projectName: null,
			taskName,
		});
		link.style.marginLeft = '10px';
		container.appendChild(link);
	}
);
