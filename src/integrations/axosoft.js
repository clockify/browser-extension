clockifyButton.render(
	'.item-field-name input:not(.clockify)',
	{ observe: true },
	() => {
		var link,
			titleText,
			wrapperElem = $('.axo-addEditItem-content'),
			titleElem = $('#name', wrapperElem),
			beforeElem =
				$('.axo-rating', wrapperElem) || $('.item-field-name', wrapperElem);
		if (titleElem !== null) {
			titleText = titleElem.value;
		}
		link = clockifyButton.createButton(titleText);
		link.classList.add('edit');
		beforeElem.parentNode.insertBefore(link, beforeElem);
	}
);

clockifyButton.render(
	'.axo-view-item-content .item-field-name:not(.clockify)',
	{ observe: true },
	() => {
		var link,
			titleText,
			wrapperElem = $('.axo-view-item-content'),
			titleElem = $('.item-field-name', wrapperElem),
			beforeElem = $('.axo-rating', wrapperElem) || titleElem;

		if (titleElem !== null) {
			titleText = titleElem.textContent;
		}
		link = clockifyButton.createButton(titleText);
		link.classList.add('view');
		beforeElem.parentNode.insertBefore(link, beforeElem);
	}
);
