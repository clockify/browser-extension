setTimeout(() => {
	/* Card overview */
	clockifyButton.render('.dialogOverviewCardContent__right:not(.clockify)', { observe: true }, (elem) => {
		const cardOverview = $('card-overview-component');
		const cardTitle = $('.dialogCardHeaderOverviewComponent__titleInput', cardOverview).textContent.trim();
		const boardTitle = $('.breadcrumbComponent__item a', cardOverview)?.textContent?.trim();

		const link = clockifyButton.createButton({ description: cardTitle, projectName: boardTitle });
		const inputForm = clockifyButton.createInput({ description: cardTitle, projectName: boardTitle });
		const input = inputForm.firstElementChild;
		const plackerInputContainer = document.createElement('placker-input-container');
		const label = document.createElement('label');

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
	});

	/* Checklist buttons in card overview */
	clockifyButton.render('card-checklist-item-component:not(.clockify)', { observe: true }, (elem) => {
		const checklist = elem.parentNode.parentNode;
		const checklistTitle = $('.cardChecklistItemsListComponentNew__checklistTitleInput', checklist)?.value?.trim();
		const itemTitle = $('.cardChecklistItemComponent__titleText', elem)?.textContent?.trim();
		const cardOverview = $('card-overview-component');
		const taskTitle = checklistTitle + ' - ' + itemTitle;
		const linkContainer = $('.cardChecklistItemComponent__contentBottom', elem);
		let boardTitle = '';

		if (cardOverview) {
			boardTitle = $('.breadcrumbComponent__item a', cardOverview)?.textContent?.trim();
		}

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

	/* Right panel in gantt chart */
	clockifyButton.render('.plackerSidebar--right:not(.clockify)', { observe: true }, (elem) => {
		const cardTitle = $('input[name="title"]', elem)?.value?.trim();

		const link = clockifyButton.createButton({ description: cardTitle, projectName: '' });
		const inputForm = clockifyButton.createInput({ description: cardTitle, projectName: '' });
		const input = inputForm.firstElementChild;
		const plackerInputContainer = document.createElement('placker-input-container');
		const label = document.createElement('label');
		const container = $('.cardDetails__attributes', elem);

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

		container.prepend(plackerInputContainer);
	});
}, 1000);
