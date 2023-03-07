clockifyButton.render(
	'.checklist-item:not(.clockify)',
	{ observe: true },
	(elem) => {
		let description = $('.item-title > .viewer > p', elem);
		let link = clockifyButton.createSmallButton(description.textContent);
		link.style.position = 'right';
		link.style.left = '15px';
		link.style.fontSize = '16px';
		elem.appendChild(link);
	}
);
