clockifyButton.render(
	'.item-sidebar .mobile-item-navigation:not(.clockify)',
	{ observe: true },
	function (elem) {
		setTimeout(function () {
			let description = $('.item-sidebar .item-name');
			let link = clockifyButton.createButton(description.textContent.trim());

			link.style.paddingTop = '0';
			link.style.paddingBottom = '0';
			link.style.cursor = 'pointer';

			elem.appendChild(link);
		}, 300);
	}
);
