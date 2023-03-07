clockifyButton.render(
	'action-panel.header__action-panel:not(.clockify), .task-view-header__actions.action-bar:not(.clockify), .wrike-panel-header-toolbar:not(.clockify)',
	{ observe: true },
	function (elem) {
		let link, description, project;
		description = $('.title__ghost')? $('.title__ghost').textContent : $('[class*="header-title__main"]').textContent;
		if (!description) description = '';
		project = $('.folder-tag-label__item--name')? $('.folder-tag-label__item--name').textContent : $('[class*="header-title__main"]').textContent;
		if (!project) project = '';
		link = clockifyButton.createButton(description, project);
		link.style.minWidth = '110px';
		elem.prepend(link);
	}
);