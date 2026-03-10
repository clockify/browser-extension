clockifyButton.render('#task-detail-inner:not(.clockify)', { observe: true }, async elem => {
	await timeout({ milliseconds: 750 });
	if ($('#clockifyButton')) return;

	const description = () => $('span[role="presentation"]', elem).textContent;
	const tagNames = () => Array.from($$('.content-editor .tag-name')).map(tag => tag.textContent);

	const link = clockifyButton.createButton({ description, tagNames });

	link.style.position = 'absolute';
	link.style.top = '23px';
	link.style.right = '50px';
	link.style.zIndex = '9999';

	elem.prepend(link);
});

window.addEventListener('hashchange', clockifyButton.rerenderAllButtons);
