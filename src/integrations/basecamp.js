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

		clockifyButton.render(
			'.item .menu_container:not(.clockify)',
			{ observe: true },
			(elem) => {
				const description = () => $('span.content', elem).textContent.trim();
				const projectName = () =>
					$('#Header h1').innerHTML.split('<')[0].trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				elem.style.display = 'flex';
				elem.style.alignItems = 'center';

				link.style.marginLeft = '15px';

				elem.append(link);
			}
		);
	}

	if (basecampVersion === '2') {
		clockifyButton.render(
			'.todolists .todo span.wrapper:not(.clockify)',
			{ observe: true },
			(elem) => {
				const todo = $('span.content', elem);

				const description = () => $('span', todo).textContent.trim();
				const projectName = () =>
					$('h1.field')?.textContent?.trim() ||
					$('header h1 a')?.textContent?.trim();

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
			(elem) => {
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

				const todoRow = $('.todo__header') ? todo : elem;

				todoRow.style.display = 'flex';
				todoRow.style.alignItems = 'center';

				link.style.margin = '0 15px';

				$('*:first-child', todo).after(link);
			}
		);

		// Card in list
		clockifyButton.render(
			'.kabanlist .kanban-card:not(.clockify)',
			{ observe: true },
			(elem) => {
				const description = () =>
					$('.checkbox__content a', elem).textContent.trim();

				const link = clockifyButton.createButton({
					description,
					small: true,
				});

				link.style.margin = '0 15px';

				$('.checkbox__content', elem).append(link);
			}
		);

		// Card Table
		clockifyButton.render(
			'#kanban_cards .kanban-card__wrap:not(.clockify)',
			{ observe: true },
			(card) => {
				card.classList.add('clockify-trello-card');
				card.addEventListener('mouseover', () => {
					const description = () =>
						$('.kanban-card__title', card).textContent.trim();
					const projectName = () => $('strong a')?.textContent?.trim();

					const link = clockifyButton.createButton({
						description,
						projectName,
						small: true,
					});

					link.style.position = 'absolute';
					link.style.right = '10px';
					link.style.bottom = '10px';
					link.style.zIndex = '9999';

					card.append(link);
				});

				card.style.minHeight = '70px';
			}
		);

		// Single Card
		clockifyButton.render(
			'#card-details .checkbox:not(.clockify)',
			{ observe: true },
			(cardHeader) => {
				const description = () =>
					$('.todo__title', cardHeader).textContent.trim();
				const projectName = () =>
					$('.playground-project-breadcrumb a')?.textContent?.trim() ||
					$('.recording-breadcrumb strong a')?.textContent?.trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				link.style.position = 'absolute';
				link.style.left = '100px';
				link.style.top = '31px';

				cardHeader.prepend(link);
			}
		);
		// To do
		clockifyButton.render(
			'.todos .todo:not(.clockify)',
			{ observe: true },
			(elem) => {
				const description = () =>
					$('.checkbox__content a', elem).textContent.trim();

				const link = clockifyButton.createButton({
					description,
					small: true,
				});

				link.style.margin = '0 15px';

				$('.todo__title', elem).append(link);
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
