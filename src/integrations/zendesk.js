setTimeout(() => {
	clockifyButton.render(
		'.pane_header:not(.clockify)',
		{ observe: true },
		function (elem) {
			let description;
			const projectName = $('title').textContent;

			const titleFunc = function () {
				const titleElem = $('.editable .ember-view input', elem);
				const ticketNum = location.href.match(/tickets\/(\d+)/);

				if (titleElem !== null) {
					description = titleElem.value.trim();
				}

				if (ticketNum) {
					description = '#' + ticketNum[1].trim() + ' ' + description;
				}
				return description;
			};

			const link = clockifyButton.createButton(
				titleFunc,
				projectName && projectName.split(' - ').shift()
			);

			if (elem.querySelector('#clockifyButton')) {
				elem.removeChild(elem.querySelector('#clockifyButton'));
			}

			elem.insertBefore(link, elem.querySelector('.btn-group'));
		}
	);
}, 1000);

setTimeout(() => {
	clockifyButton.render(
		'input[data-test-id="omni-header-subject"]:not(.clockify)',
		{ observe: true },
		(elem) => {
			const ticketNum = location.href.match(/tickets\/(\d+)/);
			const description = ticketNum
				? '#' + ticketNum[1].trim() + ' ' + elem.value.trim()
				: elem.value.trim();

			const link = clockifyButton.createButton(description);

			elem.parentElement.prepend(link);
			clockifyButton.disconnectObserver();
		}
	);
}, 1000);
