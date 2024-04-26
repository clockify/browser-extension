(() => {
	//Lightning view - task, accounts, contacts
	clockifyButton.render(
		'.slds-page-header .test-lvmForceActionsContainer:not(.clockify)',
		{ observe: true },
		(elem) => {
			let description = '';
			const objectIdRegex = /\b[a-z0-9]\w{4}0\w{12}|[a-z0-9]\w{4}0\w{9}\b/;
			const matches = window.location.href.match(objectIdRegex);
			if (matches && matches.length > 0) {
				description = `#${matches[0]} `;
			}

			description += document.title.replace(' | Salesforce', '');
			const link = clockifyButton.createButton(description);
			link.style.marginRight = '10px';
			elem.prepend(link);

			if (!elem.querySelector('#clockifyButton')) {
				elem.prepend(link);
			}
		}
	);
	//Lightning view - single lead,contact,account...
	clockifyButton.render(
		'.highlights .actionsContainer .slds-button-group-list:not(.clockify), .forceHighlightsPanel .actionsContainer .slds-button-group:not(.clockify)',
		{ observe: true },
		(elem) => {
			let description = '';
			const objectIdRegex = /\b[a-z0-9]\w{4}0\w{12}|[a-z0-9]\w{4}0\w{9}\b/;
			const matches = window.location.href.match(objectIdRegex);
			if (matches && matches.length > 0) {
				description = `#${matches[0]} `;
			}

			description += document.title.replace(' | Salesforce', '');
			const link = clockifyButton.createButton(description);
			link.style.marginRight = '10px';
			const container = elem.parentElement;
			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.prepend(link);

			if (!elem.querySelector('#clockifyButton')) {
				container.prepend(link);
			}
		}
	);
	//Salesforce Classic, all views
	clockifyButton.render(
		'.ptBody .links:not(.clockify)',
		{ observe: true },
		(elem) => {
			let description = '';
			const objectIdRegex = /\b[a-z0-9]\w{4}0\w{12}|[a-z0-9]\w{4}0\w{9}\b/;
			const matches = window.location.href.match(objectIdRegex);
			if (matches && matches.length > 0) {
				description = `#${matches[0]} `;
			}

			description += document.title.replace(' | Salesforce', '');
			const link = clockifyButton.createButton(description);
			link.style.marginRight = '10px';
			link.style.position = 'relative';
			link.style.top = '4px';
			elem.prepend(link);

			if (!elem.querySelector('#clockifyButton')) {
				elem.prepend(link);
			}
		}
	);

	//Salesforce Calendar event
	clockifyButton.render(
		'.uiPanel--calendarEventPreview .moreDetails:not(.clockify)',
		{ observe: true },
		(elem) => {
			let description = text('.uiPanel--calendarEventPreview .header h2');

			const link = clockifyButton.createSmallButton(description);

			const container = elem.lastElementChild;
			link.style.marginRight = '10px';
			container.style.display = 'flex';
			container.style.alignItems = 'center';
			container.prepend(link);

			if (!elem.querySelector('#clockifyButton')) {
				container.prepend(link);
			}
		}
	);
})();
