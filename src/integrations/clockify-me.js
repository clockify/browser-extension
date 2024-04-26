clockifyButton.observeDarkMode(() => {
	return document.body.classList.contains('dark');
});

setTimeout(() => {
	// Clockify Projects
	clockifyButton.render(
		'[projects-table-row]:not(.clockify)',
		{ observe: true },
		async (tr) => {
			const titleContainer = $('.cl-project-name', tr);
			const titleStyles = window.getComputedStyle(titleContainer);
			if (!titleStyles.textDecoration.includes('line-through')) {
				tr.classList.add('clockify-trello-card');
				const projectName = text('.cl-project-name', tr);
				const entry = {
					description: projectName,
					projectName,
				};

				const button = clockifyButton.createSmallButton(entry);
				button.style.marginRight = '10px';

				if (window.innerWidth < 1366) {
					const div = $('div', tr);
					div.insertBefore(button, div.childNodes[1]);
				} else {
					const star = $('.cl-dropdown-star', tr);
					const parent = star.parentElement;
					const div = parent.parentElement;
					div.prepend(button);
				}
			}
		}
	);

	// Clockify Tasks
	clockifyButton.render(
		'[tasks-table-row]:not(.clockify)',
		{ observe: true },
		async (tr) => {
			tr.classList.add('clockify-trello-card');
			const myOnwTaskContainer = $('td:first-child input', tr);
			let taskStyles;

			if (myOnwTaskContainer) {
				taskStyles = window.getComputedStyle(myOnwTaskContainer);
			} else {
				const taskContainer = $('td:first-child span', tr);
				taskStyles = window.getComputedStyle(taskContainer);
			}

			if (!taskStyles.textDecoration.includes('line-through')) {
				const projectName = text('h1');
				let taskName = myOnwTaskContainer
					? value('td:first-child input', tr)
					: text('td:first-child', tr);
				const entry = {
					description: taskName,
					projectName,
					taskName,
				};

				const button = clockifyButton.createSmallButton(entry);
				button.style.marginRight = '10px';
				if (window.innerWidth < 992) {
					const div = $('div', tr);
					button.style.flex = '1';
					button.style.justifyContent = 'end';
					div.insertBefore(button, div.lastElementChild);
				} else {
					const header = $('[tasks-table-header]');
					const lastRow = $('th:last-child', header);
					lastRow.style.width = '100px';
					const td = $('td:nth-last-child(2)', tr);
					const div = $('div', td);
					if (div) {
						div.prepend(button);
					} else {
						td.prepend(button);
					}
				}
			}
		}
	);
}, 1000);
