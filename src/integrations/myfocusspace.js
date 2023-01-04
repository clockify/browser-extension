clockifyButton.render(
	'#clockify_zone:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description = elem.parentNode.innerText;

		link = clockifyButton.createSmallButton(description);
		link.style.padding = '10px';
		elem.appendChild(link);
	}
);
