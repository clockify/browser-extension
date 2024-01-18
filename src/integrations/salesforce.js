(() => {
	//Lightning view - task, accounts, contacts
	clockifyButton.render(
		'[role="group"].actionsContainer:not(.clockify), [data-aura-class="forceListViewManagerHeader"]:not(.clockify) .branding-actions:not(.clockify), [data-aura-class="forceActionsContainer"] [data-target-selection-name]:not(.clockify)',
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
		'.slds-page-header__controls .slds-button-group-list:not(.clockify)',
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
			link.style.marginLeft = '10px';
			elem.appendChild(link);

			if (!elem.querySelector('#clockifyButton')) {
				elem.appendChild(link);
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
})();
