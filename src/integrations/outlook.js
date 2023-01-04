// Inbox emails
clockifyButton.render(
	'[aria-label="Reading Pane"] [role="heading"]:not(.clockify)',
	{ observe: true },
	(elem) => {
		const link = clockifyButton.createButton(elem.textContent);
		link.style.paddingLeft = '5px';

		elem.appendChild(link);
	}
);

// Composing emails
clockifyButton.render(
	'[aria-label="Command toolbar"] .ms-CommandBar-primaryCommand:not(.clockify)',
	{ observe: true },
	(elem) => {
		const isComposingEmail = elem.querySelector('button[name="Send"]');

		if (isComposingEmail) {
			const subject = () =>
				document.querySelector('[aria-label="Add a subject"]').value;

			const link = clockifyButton.createButton(subject);
			link.style.paddingLeft = '5px';

			elem.appendChild(link);
		}
	}
);
