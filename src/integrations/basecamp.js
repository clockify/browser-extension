// Name 			| Sign up URL 										| URL pattern
// Basecamp Classic | https://signup.37signals.com/basecamp/free/ 		| *://*.basecamphq.com/*
// Basecamp 2 		| https://billing.37signals.com/bcx/trial/signup/ 	| *://basecamp.com/*
// Basecamp 4 		| https://basecamp.com/pricing 						| *://*.basecamp.com/*

(() => {
	const currentUrl = location.hostname;
	const currentUrlParts = currentUrl.split('.').length;
	const basecampVersion = currentUrl.includes('basecamphq')
		? 'CLASSIC'
		: currentUrlParts === 2
		? '2'
		: '4';

	if (basecampVersion === 'CLASSIC') {
		addCustomCss();

		clockifyButton.render('.item .menu_container:not(.clockify)', { observe: true }, elem => {
			const description = () => $('span.content', elem).textContent.trim();
			const projectName = () => $('#Header h1').innerHTML.split('<')[0].trim();

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			elem.style.display = 'flex';
			elem.style.alignItems = 'center';

			link.style.marginLeft = '15px';

			elem.append(link);
		});
	}

	if (basecampVersion === '2') {
		clockifyButton.render(
			'.todolists .todo span.wrapper:not(.clockify)',
			{ observe: true },
			elem => {
				const todo = $('span.content', elem);

				const description = () => $('span', todo).textContent.trim();
				const projectName = () =>
					$('h1.field')?.textContent?.trim() || $('header h1 a')?.textContent?.trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				elem.style.display = 'flex';
				elem.style.alignItems = 'center';

				link.style.margin = '0 15px';

				todo.after(link);
			}
		);
	}

	if (basecampVersion === '4') {
		// Task in list
		clockifyButton.render(
			'.todolist .todo:not(.clockify):not(.completed)',
			{ observe: true },
			elem => {
				const todo = $('.checkbox .checkbox__content', elem);

				const description = () => $('a', todo).textContent.trim();
				const projectName = () =>
					$('[data-breadcrumbs-target="link"]')?.textContent?.trim() ||
					$('.latest-activity__project')?.textContent?.trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				link.style.display = 'inline-block';
				link.style.fontSize = '4px';
				link.style.margin = '0 8px';

				$('*:first-child', todo).after(link);
			}
		);

		// Card in list
		clockifyButton.render(
			'.assignments-list .kanban-card:not(.clockify)',
			{ observe: true },
			elem => {
				const card = $('.checkbox__content', elem);
				const description = () => $('a', card).textContent.trim();

				// My Assignments
				const projectContainer = elem.closest('.assignments__bucket');
				const projectNameMyAssignments = projectContainer
					? text('h2 a', projectContainer)
					: '';

				// My Assignments with dates
				const myAssignmentsWithDatesContainer = elem.closest('.schedule-day__events');
				const projectNameMyAssignmentsWithDates = myAssignmentsWithDatesContainer
					? $$('a', myAssignmentsWithDatesContainer)
					: '';

				const projectName = projectNameMyAssignmentsWithDates.length
					? projectNameMyAssignmentsWithDates[1].textContent.trim()
					: projectNameMyAssignments;

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				link.style.margin = '0 10px';
				link.style.display = 'inline-block';

				$('*:first-child', card).after(link);
			}
		);

		// Card Table
		clockifyButton.render(
			'#kanban_cards .kanban-card__wrap:not(.clockify)',
			{ observe: true },
			card => {
				card.classList.add('clockify-trello-card');
				const description = () => $('.kanban-card__title', card).textContent.trim();
				const projectName = () => $('strong a')?.textContent?.trim();

				const link = clockifyButton.createSmallButton({
					description,
					projectName,
				});

				link.style.position = 'absolute';
				link.style.right = '10px';
				link.style.bottom = '10px';
				link.style.zIndex = '9999';

				card.append(link);

				card.style.minHeight = '70px';
			}
		);

		// Single Card
		clockifyButton.render(
			'#card-details .checkbox:not(.clockify)',
			{ observe: true },
			cardHeader => {
				const description = () => $('.todo__title', cardHeader).textContent.trim();
				const projectName = () =>
					$('.playground-project-breadcrumb a')?.textContent?.trim() ||
					$('.recording-breadcrumb strong a')?.textContent?.trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				link.style.position = 'absolute';
				link.style.left = '90px';
				link.style.top = '20px';

				cardHeader.prepend(link);
			}
		);

		// To do in Activity
		clockifyButton.render(
			'.latest-activity__blob--todo_created:not(.clockify)',
			{ observe: true },
			elem => {
				const description = () => $('.checkbox__content a', elem).textContent.trim();
				const projectName = $('.latest-activity__project a', elem).textContent?.trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				link.style.margin = '0 10px';
				link.style.display = 'inline-block';

				$('.checkbox__content', elem).append(link);
			}
		);

		//To do details
		clockifyButton.render('.todos .todo:not(.clockify)', { observe: true }, elem => {
			const breadCrumbs = $$('[data-breadcrumbs-target="link"]');
			const description = () => $('.checkbox__content a', elem).textContent.trim();
			const projectName = breadCrumbs[0]?.textContent?.trim();

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			link.style.margin = '0 15px';
			link.style.display = 'inline-block';

			const title = $('.todo__title', elem);

			if (title) {
				title.append(link);
			}
		});

		// MyAssignments Todos list
		clockifyButton.render('.assignments-list .todo:not(.clockify)', { observe: true }, elem => {
			const todo = $('.checkbox .checkbox__content', elem);
			const description = () => $('a', todo).textContent.trim();

			let projectName = '';

			// My Assignments
			const projectContainer = elem.closest('.assignments__bucket');
			if (projectContainer) {
				projectName = text('h2 a', projectContainer);
			}

			// My Assignments with dates
			const myAssignmentsWithDatesContainer = elem.closest('.schedule-day__events');
			if (myAssignmentsWithDatesContainer) {
				projectName = $$('a', myAssignmentsWithDatesContainer)[1].textContent.trim();
			}

			//Up Next
			if (!projectContainer && !myAssignmentsWithDatesContainer) {
				const todoText = text('.todo__ancestry', elem);
				const textArray = todoText.split(' in ');
				if (textArray.length > 0) {
					projectName = textArray[textArray.length - 1];
				}
			}

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			link.style.margin = '0 10px';
			link.style.display = 'inline-block';

			$('.checkbox__content', elem).append(link);

			$('*:first-child', todo).after(link);
		});
	}
})();

function addCustomCss() {
	if ($('.clockify-custom-style')) return;

	const css = `
			.clockify-integration-popup {
				text-align: initial !important;
			}
		`;

	const style = createTag('style', 'clockify-custom-style', css);

	document.head.append(style);
}
