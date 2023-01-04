clockifyButton.render(
	'.detailHeader:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link, description;
		description = $('.editableContent-display', elem).title;
		link = clockifyButton.createButton(description);
		link.style.display = 'block';
		link.style.paddingTop = '0';
		link.style.paddingBottom = '0';
		link.style.marginBottom = '10px';
		link.style.marginTop = '10px';
		link.style.marginLeft = '6px';
		link.style.cursor = 'pointer';
		elem.appendChild(link);
	}
);
