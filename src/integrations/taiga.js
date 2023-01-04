function clockify$(s, elem) {
	elem = elem || document;
	return elem.querySelector(s);
}

/* Epic/User story/Task/Issue details button */
clockifyButton.render(
	'.detail-title-wrapper:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			input,
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			refElem = clockify$('.detail-ref', elem),
			titleElem = clockify$('.detail-subject', elem);
		taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
			small: true,
		});
		input = clockifyButton.createInput({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
		});
		link.style.marginRight = '.4em';
		input.style.marginRight = '.4em';
		input.style.fontSize = 'small';
		// elem.insertbefore(link, clockify$('.detail-title-text', elem));
		elem.append(link);
		elem.insertBefore(input, link);
	}
);

/* Epics Dashboard */
clockifyButton.render(
	'.epic-row .name:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			refElem = clockify$('a > span:nth-child(1)', elem),
			titleElem = clockify$('a > span:nth-child(2)', elem),
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
			small: true,
		});
		link.style.marginRight = '.2em';
		elem.insertBefore(link, clockify$('a', elem));
	}
);

/* Backlog buttons */

clockifyButton.render(
	'.user-story-main-data:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			refElem = clockify$('a > span:nth-child(1)', elem),
			titleElem = clockify$('a > span:nth-child(2)', elem),
			taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;

		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
			small: true,
		});

		elem.insertBefore(link, clockify$('a', elem));
	}
);

/* Kanban buttons */

clockifyButton.render(
	'.kanban .card-title:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			refElem = clockify$('a > span:nth-child(1)', elem),
			titleElem = clockify$('a > span:nth-child(2)', elem),
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;

		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName,
			small: true,
		});
		link.style.flexGrow = 0;
		/*change display from flex to inline-flex to put the button inline with the task link*/
		link.style.display = 'inline-flex';
		clockify$('a', elem).style.display = 'inline-flex';
		link.style.marginRight = '.2em';
		elem.insertBefore(link, clockify$('a', elem));
	}
);

/* Sprint Taskboard tasks buttons */
clockifyButton.render(
	'.taskboard .card-title:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			input,
			refElem = clockify$('.card-title > a > span:nth-child(1)', elem),
			titleElem = clockify$('.card-title > a > span:nth-child(2)', elem),
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;

		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
			small: true,
		});
		input = clockifyButton.createInput({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
		});
		link.style.flexGrow = 0;

		link.style.display = 'inline';
		link.style.marginRight = '.2em';
		input.style.display = 'inline';
		input.style.marginRight = '.2em';
		input.style.height = '25px';
		input.style.fontSize = 'small';
		elem.insertBefore(link, clockify$('a', elem));
		elem.insertBefore(input, link);
	}
);

/* Issues list buttons */
clockifyButton.render(
	'.row:not(.title) > div.subject:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			refElem = clockify$('.issue-text > span:nth-child(1)', elem),
			titleElem = clockify$('.issue-text > span:nth-child(2)', elem),
			taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
			small: true,
		});
		/*change display from flex to inline-flex to put the button inline with the task link*/
		link.style.display = 'inline-flex';
		clockify$('a', elem).style.display = 'inline-flex';
		link.style.marginRight = '.2em';
		elem.prepend(link);
	}
);

/* Task list in User story details buttons */
clockifyButton.render(
	'.related-tasks-body > .single-related-task > .task-name:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			projectElem = clockify$(
				'div.sticky-project-menu > tg-legacy-loader'
			).shadowRoot.querySelector('span.project-name'),
			refElem = clockify$('a > span:nth-child(1)', elem),
			titleElem = clockify$('a > span:nth-child(2)', elem),
			taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
		link = clockifyButton.createButton({
			description: taskName,
			projectName: projectElem.textContent.trim(),
			taskName: taskName,
			small: true,
		});
		link.style.marginRight = '.2em';
		elem.insertBefore(link, clockify$('a', elem));
	}
);
