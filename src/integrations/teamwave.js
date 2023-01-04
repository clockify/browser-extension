// Deal detail page
clockifyButton.render(
	'.actionsContentForDeal:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description = 'Deal : ' + $('.descriptionHeadForDeal h1 a').textContent;
		link = clockifyButton.createButton(description);
		link.style.paddingTop = '0';
		link.style.paddingBottom = '0';
		link.style.marginBottom = '10px';
		link.style.marginTop = '8px';
		link.style.marginLeft = '-210px';
		link.style.cursor = 'pointer';
		elem.appendChild(link);
	}
);

// contact detail page
clockifyButton.render(
	'.actionsContentForContact:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description =
			'Contact : ' + $('.descriptionHeadForContact span').textContent;
		link = clockifyButton.createButton(description);
		link.style.paddingTop = '0';
		link.style.paddingBottom = '0';
		link.style.marginBottom = '10px';
		link.style.marginTop = '8px';
		link.style.marginLeft = '-302px';
		link.style.cursor = 'pointer';
		elem.prepend(link);
	}
);

// Organization detail page
clockifyButton.render(
	'.actionsContentForOrganizations:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description =
			'Organization : ' + $('.descriptionHeadForOrganization span').textContent;
		link = clockifyButton.createButton(description);
		link.style.paddingTop = '0';
		link.style.paddingBottom = '0';
		link.style.marginBottom = '-27px';
		link.style.marginTop = '8px';
		link.style.marginRight = '93px';
		link.style.marginLeft = '-98px';
		link.style.display = 'block';
		link.style.cursor = 'pointer';
		elem.prepend(link);
	}
);

// Task detail page
clockifyButton.render(
	'.actionsContentForPmTask:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description = ' Task : ' + $('.descriptionHeadForPmTask span').textContent;
		link = clockifyButton.createButton(description);
		link.style.paddingTop = '0';
		link.style.paddingBottom = '0';
		link.style.marginBottom = '-10px';
		link.style.marginTop = '-10px';
		link.style.marginRight = '5px';
		link.style.marginLeft = '-18px';
		link.style.cursor = 'pointer';
		elem.prepend(link);
	}
);
