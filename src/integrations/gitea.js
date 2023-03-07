clockifyButton.render(
	'.issue .two.column.stackable.grid .right:not(.clockify)',
	{ observe: true },
	function (elem) {
		issueId = $('.issue .index').innerText;
		description = issueId + ' ' + $('.issue #issue-title').innerText;
		project = $('.repo-title a').innerText;
		tags = () => Array.from($$('.labels .label')).map((e) => e.innerText);

		link = clockifyButton.createButton({
			description: description,
			projectName: project,
			tagNames: tags,
		});
		inputForm = clockifyButton.createInput({
			description: description,
			projectName: project,
			tagNames: tags,
		});

		link.style.padding = '3px 14px';

		elem.prepend(link);
		elem.prepend(inputForm);

		$('.clockify-input').style.float = 'left';
		$('.clockify-input').style.marginLeft = '30%';
	}
);
