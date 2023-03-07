// Inbox
clockifyButton.render(
	'.inbox2__composer__container > div:last-child:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description = $(
			'.text-lg.u__one-truncated-line > div > span'
		).textContent;

		const companyRow = $('.o__inbox2__company')?.closest(
			'.flex.flex-row.items-center'
		);
		const companyName = $(
			'p > span > a > span',
			companyRow
		)?.textContent?.trim();
		const projectName = companyName ?? '';

		const link = clockifyButton.createButton({ description, projectName });

		link.style.padding = '8px';
		link.style.position = 'absolute';
		link.style.marginLeft = '80px';

		$('div:first-child', elem).after(link);
	}
);

// Articles
clockifyButton.render(
	'.js__articles__scrollable-content .flex.flex-row.pr-8.pt-6.pb-2:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description =
			$('.educate__article__editor__title')?.getAttribute('placeholder') ||
			$('.educate__article__view__title')?.textContent?.trim() ||
			'';

		const link = clockifyButton.createButton({ description });

		link.style.marginRight = '20px';

		elem.prepend(link);
	}
);
