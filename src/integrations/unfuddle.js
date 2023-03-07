clockifyButton.render(
	'.tasks-task__paper:not(.clockify)',
	{ observe: true },
	function (elem) {
		var link;
		link = clockifyButton.createButton(
			$('.tasks-title__text span:first-child').textContent
		);

		$('.tasks-task__info_actions_container', elem).appendChild(link);
	}
);
