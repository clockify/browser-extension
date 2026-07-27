clockifyButton.render('div.nH div.ha:not(.clockify)', { observe: true }, elem => {
	let description = text('h2', elem);

	const link = clockifyButton.createButton(description);

	link.style.fontSize = '14px';
	link.style.fontWeight = '400';

	elem.appendChild(link);
});
