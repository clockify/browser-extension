clockifyButton.render(
	'div.nH div.ha:not(.clockify)',
	{ observe: true },
	function (elem) {
		let link,
			description = $('h2', elem);
		if (!description) {
			return;
		}
		link = clockifyButton.createButton(description.textContent);
		link.style.marginLeft = '20px';
		link.style.fontSize = '14px';
		elem.appendChild(link);
	}
);
