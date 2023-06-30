clockifyButton.render(
	'#td-caption:not(.clockify)',
	{ observe: true },
	(elem) => {
		elem.querySelector('#clockifyButton')?.remove();

		const description = () => $('span[role="presentation"]', elem).textContent;
		const tagNames = () =>
			Array.from($$('.content-editor .tag-name')).map((tag) => tag.textContent);

		const link = clockifyButton.createButton({ description, tagNames });

		link.style.margin = '10px 0';

		elem.append(link);
	},
	null,
	'#td-caption span[role="presentation"]'
);
