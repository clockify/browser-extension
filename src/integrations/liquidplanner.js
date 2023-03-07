clockifyButton.render(
	'#treeitem_panel .details.page:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description = $('#treeitem_panel_name').textContent,
			projectFunc = function () {
				var text = $('#treeitem_panel_parent').textContent.split('>');
				return text[text.length - 1].trim();
			};

		link = clockifyButton.createButton(description);

		elem.insertBefore(link, elem.firstChild);
	}
);
