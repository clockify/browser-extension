clockifyButton.render(
	'.zenkit-entry-detail-popup-subheader-left:not(.clockify)',
	{ observe: true },
	function (elem) {
		let description = $('.zenkit-details-view__display-string');
		let link = clockifyButton.createButton(description.textContent);
		elem.append(link);
	}
);
