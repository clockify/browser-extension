'use strict';

clockifyButton.render('.ticketZoom-header:not(.clockify)', {observe: true}, function (elem) {
	var link, titleFunc, description,
		divTag = document.createElement("div");

	titleFunc = function () {
		var titleElem = $('.ticket-title-update'),
			ticketNum = $('.ticket-number').textContent.trim();

		if (titleElem !== null) {
			description = titleElem.textContent.trim();
		}

		if (ticketNum) {
			description = '#' + ticketNum + " " + description;
		}
		return description;
	};

	link = clockifyButton.createButton(titleFunc);
	link.style.marginLeft = '10px';
	link.style.backgroundColor = 'white';
	link.style.border = '1px solid rgba(0,0,0,0.1)';
	link.style.borderRadius = '4px';
	link.style.padding = '6px 11px 6px 30px';
	link.style.backgroundPosition = '11px 6px';
	link.style.color = '#999';
	divTag.appendChild(link);
	$('.ticketZoom-controls').appendChild(divTag);
});
