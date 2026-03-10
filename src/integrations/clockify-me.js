clockifyButton.observeDarkMode(() => document.body.classList.contains('dark'));

// Clockify Projects
renderProjectTimer();

function renderProjectTimer() {
	clockifyButton.render(
		'[projects-table-row]:not(.clockify)',
		{ observe: true, showTimerOnhover: 'tr', onNavigationRerender: true },
		tr => {
			const titleContainer = $('.cl-project-name', tr);
			const titleStyles = window.getComputedStyle(titleContainer);

			if (titleStyles.textDecoration.includes('line-through')) return;

			const projectName = text('.cl-project-name', tr);

			const entry = { description: projectName, projectName };

			const timer = clockifyButton.createSmallButton(entry);

			timer.style.marginRight = '10px';

			if (window.innerWidth < 1366) {
				const div = $('div', tr);
				div.insertBefore(timer, div.childNodes[1]);
			} else {
				const star = $('.cl-dropdown-star', tr);
				const parent = star?.parentElement;
				let elem = parent?.parentElement;

				if (!elem) {
					elem = $('td:nth-last-child(2)', tr).firstChild;
				}

				elem.prepend(timer);
			}
		},
	);
}

watchForNewTaskElements();
watchForNewProjectElements();

async function watchForNewProjectElements() {
	await waitForElement('[projects-table-row]:not(.clockify)');

	renderProjectTimer();
	watchForNewProjectElements();
}

async function watchForNewTaskElements() {
	await waitForElement('[tasks-table-row]:not(.clockify)');

	renderTaskTimer();
	watchForNewTaskElements();
}

// Clockify Tasks
renderTaskTimer();

function renderTaskTimer() {
	clockifyButton.render(
		'[tasks-table-row]:not(.clockify)',
		{ observe: true, showTimerOnhover: 'tr', onNavigationRerender: true },
		tr => {
			const myOnwTaskContainer = $('td:first-child input', tr);
			let taskStyles;

			if (myOnwTaskContainer) {
				taskStyles = window.getComputedStyle(myOnwTaskContainer);
			} else {
				const taskContainer = $('td:first-child span', tr);
				taskStyles = window.getComputedStyle(taskContainer);
			}

			if (taskStyles.textDecoration.includes('line-through')) return;

			const projectName = text('h1');
			let taskName = myOnwTaskContainer
				? value('td:first-child input', tr)
				: text('td:first-child', tr);

			const entry = { description: taskName, projectName, taskName };

			const timer = clockifyButton.createSmallButton(entry);

			timer.style.marginRight = '10px';
			if (window.innerWidth < 992) {
				const div = $('div', tr);
				timer.style.flex = '1';
				timer.style.justifyContent = 'end';
				div.insertBefore(timer, div.lastElementChild);
			} else {
				const header = $('[tasks-table-header]');
				const lastRow = $('th:last-child', header);
				lastRow.style.width = '100px';
				const td = $('td:nth-last-child(2)', tr);
				const div = $('div', td);
				if (div) {
					div.prepend(timer);
				} else {
					td.prepend(timer);
				}
			}
		},
	);
}

function debounce(func, delay) {
	let timeoutId;
	return function(...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}

const debouncedHandleResize = debounce(clockifyButton.rerenderAllButtons, 500);
window.addEventListener('resize', debouncedHandleResize);