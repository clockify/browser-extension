// List items
clockifyButton.render('.list li:not(.clockify)', { observe: true }, (elem) => {
	var link,
		taskElement = $('.task-title', elem),
		description = $('a', taskElement).textContent.trim(),
		projectName = function () {
			var label = $('span.highlight', taskElement);
			if (!!label) {
				return label.textContent;
			}
			return '';
		};
	link = clockifyButton.createSmallButton(description);

	taskElement.appendChild(link);
});

// List items in new UI
clockifyButton.render(
	'.general-task-item:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			taskElement = $('.general-task-item-title', elem),
			description = function () {
				var desc = $('.general-task-item-title-text', elem);
				if (!!desc) {
					return desc.textContent.trim();
				}
				return '';
			},
			projectName = function () {
				var label = $('.general-task-item-category', elem);
				if (!!label) {
					return label.textContent;
				}
				return '';
			};

		link = clockifyButton.createSmallButton(description);

		taskElement.appendChild(link);
	}
);
