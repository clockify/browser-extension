setTimeout(() => {
	/* Card overview */
	clockifyButton.render('.dialogOverviewCardContent__right .cardDetails__hiddenAttributes:not(.clockify)', { observe: true }, (elem) => {
		const cardOverview = $('card-overview-component');
		const cardTitle = $('.dialogCardHeaderOverviewComponent__titleInput', cardOverview).textContent.trim();
		const boardTitle = $('.breadcrumbComponent__item a', cardOverview)?.textContent?.trim();

		const link = clockifyButton.createButton({ description: cardTitle, projectName: boardTitle });
		const inputForm = clockifyButton.createInput({ description: cardTitle, projectName: boardTitle });
		const input = inputForm.firstElementChild;
		const plackerInputContainer = document.createElement('placker-input-container');
		const label = document.createElement('label');

		addToRightPanel({ input, label, inputForm, link, plackerInputContainer, elem });
	});

	/* Checklist items in card overview */
	clockifyButton.render('card-checklist-item-component:not(.clockify)', { observe: true }, (elem) => {
		const checklist = elem.parentNode.parentNode;
		const checklistTitle = checklist.dataset?.checklistTitle;
		const boardTitle = checklist.dataset?.boardTitle;
		const cardTitle = checklist.dataset?.cardTitle;
		const itemTitle = $('.cardChecklistItemComponent__titleText', elem)?.textContent?.trim();
		const taskTitle = cardTitle + '-' + checklistTitle + ' - ' + itemTitle;
		const linkContainer = $('.cardChecklistItemComponent__contentBottom', elem);

		const link = clockifyButton.createButton({
			description: taskTitle,
			projectName: boardTitle,
			small: true,
		});

		link.classList.add('plackerButton');
		link.classList.add('palckerButton--justTransparent');
		link.classList.add('m-l-4');
		linkContainer.append(link);
	});

	/* Cards on lists */
	clockifyButton.render('card-front-component:not(.clockify)', { observe: true }, (elem) => {
		const cardTitle = $('.cardTitle', elem)?.textContent?.trim();
		const linkContainer = $('.cardContainer__iconsAndDates', elem);

		const link = clockifyButton.createButton({
			description: cardTitle,
			projectName: '',
			small: true,
		});

		link.classList.add('m-t-8');

		linkContainer.append(link);
	});

	/* Right panel cards in gantt chart */
	clockifyButton.render('.cardDetails .cardDetails__hiddenAttributes:not(.clockify)', { observe: true }, (elem) => {
		const cardTitle = elem.dataset?.cardTitle?.trim();
		const boardTitle = elem.dataset?.boardTitle?.trim();

		const link = clockifyButton.createButton({ description: cardTitle, projectName: boardTitle });
		const inputForm = clockifyButton.createInput({ description: cardTitle, projectName: boardTitle });
		const input = inputForm.firstElementChild;
		const plackerInputContainer = document.createElement('placker-input-container');
		const label = document.createElement('label');

		addToRightPanel({ input, label, inputForm, link, plackerInputContainer, elem });
	});

	/* Right panel items in gantt chart */
	clockifyButton.render('.checklistItemDetails .cardDetails__hiddenAttributes:not(.clockify)', { observe: true }, (elem) => {
		const cardTitle = elem.dataset?.cardTitle?.trim();
		const boardTitle = elem.dataset?.boardTitle?.trim();
		const checklistTitle = elem.dataset?.checklistTitle?.trim();
		const checklistItemTitle = elem.dataset?.checklistItemTitle?.trim();
		const taskTitle = cardTitle + ' - ' + checklistTitle + ' - ' + checklistItemTitle;

		const link = clockifyButton.createButton({ description: taskTitle, projectName: boardTitle });
		const inputForm = clockifyButton.createInput({ description: taskTitle, projectName: boardTitle });
		const input = inputForm.firstElementChild;
		const plackerInputContainer = document.createElement('placker-input-container');
		const label = document.createElement('label');

		addToRightPanel({ input, label, inputForm, link, plackerInputContainer, elem });
	});
}, 1000);


function addToRightPanel({ input, label, inputForm, link, plackerInputContainer, elem}) {
	label.classList.add('plackerInput__label');
	label.innerText = 'Clockify';

	inputForm.classList.add('m-b-0');

	input.classList.add('plackerInput');
	input.classList.add('plackerInput--fullWidth');
	input.classList.add('plackerInput--transparent');
	input.classList.add('plackerInput--condensed');
	input.classList.remove('clockify-input');
	input.classList.remove('clockify-input-default');

	link.classList.add('plackerButton');
	link.classList.add('plackerButton--secondary');
	link.classList.add('plackerButton--fullWidth');
	link.classList.add('plackerButton--centered');
	link.classList.add('m-b-8');
	link.style.height = '32px';

	plackerInputContainer.append(label);
	plackerInputContainer.append(link);
	plackerInputContainer.append(inputForm);

	plackerInputContainer.style.display = 'flex';
	plackerInputContainer.style.width = '100%';
	plackerInputContainer.style.flexDirection = 'column';

	elem.prepend(plackerInputContainer);
}
