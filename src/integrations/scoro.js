// Task list
clockifyButton.render('.TaskRow:not(.clockify)', { observe: true }, (elem) => {
	const title = $('.eventName .bold', elem).textContent;

	const link = clockifyButton.createButton({
		description: title,
		small: true,
	});

	link.dataset.title = title;

	link.style.marginTop =
		window.location.href.indexOf('tasks') !== -1 ? '10px' : '11px';
	link.style.paddingLeft = '8px';

	elem.appendChild(link);
});

// Single task
clockifyButton.render(
	'.buttonbar.compact-button-bar .d-inline-flex:not(.clockify)',
	{ observe: true },
	(elem) => {
		const title = $('div.main-row-title').textContent.trim();

		const link = clockifyButton.createButton(title);

		link.style.whiteSpace = 'nowrap';
		link.style.paddingBottom = '3px';

		elem.prepend(link);
	}
);
