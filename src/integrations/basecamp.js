// Name 			| Sign up URL 										| URL pattern
// Basecamp Classic | https://signup.37signals.com/basecamp/free/ 		| *://*.basecamphq.com/*
// Basecamp 2 		| https://billing.37signals.com/bcx/trial/signup/ 	| *://basecamp.com/*
// Basecamp 4 		| https://basecamp.com/pricing 						| *://*.basecamp.com/*
// Basecamp 5       | https://app.basecamp.com/							| *://*.app.basecamp.com/*

(() => {
	const currentUrl = location.hostname;
	const currentUrlParts = currentUrl.split('.').length;
	let basecampVersion = currentUrl.includes('basecamphq')
		? 'CLASSIC'
		: currentUrlParts === 2
			? '2'
			: '4';

	if (window.location.hostname === 'app.basecamp.com') {
		basecampVersion = '5';
	}

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

	if (basecampVersion === '5') {
		// Task in list
		clockifyButton.render(
			'.todolist .todo .todo__content:not(.clockify):not(.completed)',
			{ observe: true },
			async todo => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', todo)) return;

				const description = () => text('a', todo);
				const projectName = () =>
					text('.perma-toolbar__breadcrumb.perma-toolbar__breadcrumb--bucket > strong');

				const link = clockifyButton.createSmallButton({
					description,
					projectName,
				});

				link.style.display = 'inline-block';
				link.style.fontSize = '4px';
				link.style.margin = '0 8px';

				$('*:first-child', todo).after(link);
			}
		);

		// Item in list
		clockifyButton.render(
			'.assignments-list .assignment:not(.clockify), .todo-ledger__group .todo:not(.clockify), .recordable--constrained .assignment.todo:not(.clockify)',
			{ observe: true },
			async elem => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', elem)) return;

				const card = $('.todo__content', elem) || $('.checkbox-field__content', elem);
				const description = () => $('a', card)?.textContent.trim();

				// My Assignments
				const projectContainer = elem.closest('[id*="assignments_bucket"]');
				const projectNameMyAssignments = projectContainer
					? text('h2 a', projectContainer)
					: '';

				// My Assignments with dates
				const myAssignmentsWithDatesContainer = elem.closest('.assignment-day__items');
				const projectNameMyAssignmentsWithDates = myAssignmentsWithDatesContainer
					? text('div.text-subtle > a:last-child', myAssignmentsWithDatesContainer)
					: '';

				let projectName = projectNameMyAssignmentsWithDates || projectNameMyAssignments;

				if (!projectName) {
					const projectNameText = text('.assignment__ancestry.metadata', elem);

					projectName =
						text('summary > h2', elem.closest('details')) ||
						text('h2', elem.parentElement.parentElement.closest('article')) ||
						text('a:last-child', elem.parentElement.previousElementSibling) ||
						(projectNameText.split(' in ')[1] ?? projectNameText);
				}

				const link = clockifyButton.createSmallButton({
					description,
					projectName,
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
			async card => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', card)) return;

				card.classList.add('clockify-trello-card');
				const description = () => text('.kanban-card__title', card);
				const projectName = () =>
					text('.perma-toolbar__breadcrumb.perma-toolbar__breadcrumb--bucket > strong');

				const link = clockifyButton.createSmallButton({ description, projectName });

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
			'article.recordable:not(.clockify, .chat)',
			{ observe: true },
			async cardHeader => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', cardHeader)) return;

				const description = () => text('.perma-header__title', cardHeader);
				const projectName = () =>
					text('.perma-toolbar__breadcrumb.perma-toolbar__breadcrumb--bucket > strong');

				const link = clockifyButton.createSmallButton({
					description,
					projectName,
				});

				link.style.position = 'absolute';
				link.style.left = '15px';
				link.style.top = '95px';
				link.style.zIndex = '99999';

				cardHeader.prepend(link);
			}
		);

		// Subtasks
		clockifyButton.render(
			'.field-row.field-row--steps .steps turbo-frame.recording-status-active .step__content.checkbox-field__content:not(.clockify)',
			{ observe: true },
			async elem => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', elem)) return;

				const description = () => text('.step__title', elem);
				const projectName = text(
					'.perma-toolbar__breadcrumb.perma-toolbar__breadcrumb--bucket > strong'
				);

				const button = clockifyButton.createSmallButton({ description, projectName });

				elem.style.display = 'flex';
				elem.style.gap = '5px';

				elem.prepend(button);
			}
		);

		// My tasks - mini modal
		clockifyButton.render(
			'#my_navigation_assignments_content .checkbox-field__content.checkbox-field__content:not(.clockify)',
			{ observe: true },
			content => {
				const description = text('a', content);
				const projectNameText = text('.assignment__ancestry.metadata', content);
				const projectName = projectNameText.split(' in ')[1] ?? projectNameText;

				const button = clockifyButton.createSmallButton({ description, projectName });

				button.style.marginTop = '3px';

				content.before(button);
			}
		);

		// To do in Activity
		clockifyButton.render(
			'.past-day-activity .checkbox-field:not(.clockify)',
			{ observe: true, onNavigationRerender: true },
			async elem => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', elem)) return;

				const description = () => text('.checkbox-field__content > a', elem);
				const projectName = text(
					'.past-day-project__link',
					elem.parentElement.parentElement.parentElement.parentElement.parentElement
				);

				const link = clockifyButton.createSmallButton({
					description,
					projectName,
				});

				link.style.margin = '0 10px';
				link.style.display = 'inline-block';

				$('.checkbox-field__content', elem).append(link);
			}
		);

		// MyAssignments Todos list
		clockifyButton.render(
			'.assignments-list .todo:not(.clockify)',
			{ observe: true },
			async elem => {
				await timeout({ milliseconds: 500 });
				if ($('.clockifyButton', elem)) return;

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
			}
		);
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
