// list new ui
clockifyButton.render(
	'.FastTaskItemComponent--fk-FastTaskItemComponent-MainContent:not(.clockify)',
	{ observe: true },
	(elem) => {
		//let project = $('.project_name').textContent.trim();
		let projectElem = $('.Header--fk-Header-ProjectName');
		if (projectElem) {
			let project = projectElem.textContent.trim();
			let description = $(
				'.FastTaskItemComponent--fk-FastTaskItemComponent-ItemTitle',
				elem
			).textContent.trim();
			let link = clockifyButton.createSmallButton(description, project);
			link.style.paddingTop = '0px';
			link.style.paddingRight = '10px';
			elem.parentNode.prepend(link);
		}
	}
);

// detail

//clockifyButton.render('.ItemView--fk-Item-Title:not(.clockify)', {observe: true}, (elem) => {
clockifyButton.render(
	'.ItemBasicFields--fk-ItemBasicFields-Title-Wrap:not(.clockify)',
	{ observe: true },
	(elem) => {
		let projectElem = $('.ItemViewHeader--fk-ItemViewHeader-Project-Name');
		if (projectElem) {
			let project = projectElem.textContent.trim();

			// let description = $('.ItemView--fk-Item-Title').textContent.trim();
			const descriptionElem = $(
				'.ItemBasicFields--fk-ItemBasicFields-Title-Wrap'
			);
			const description = descriptionElem
				? descriptionElem.textContent.trim()
				: '';

			let link = clockifyButton.createSmallButton(description, project);
			link.style.paddingRight = '10px';
			//elem.parentNode.prepend(link);
			//elem.parentNode.insertBefore(link, elem);
			elem.prepend(link);
		}
	}
);

// task view new ui
clockifyButton.render(
	'#mainItemWrap:not(.clockify)',
	{ observe: true },
	(elem) => {
		let projectElem = $('#project_name .project_name');
		if (projectElem) {
			let project = projectElem.textContent.trim();
			let description = $('.ItemView--fk-Item-Title').textContent.trim();
			let link = clockifyButton.createButton(description, project);
			link.style.paddingTop = '10px';
			link.style.paddingLeft = '20px';
			elem.parentNode.prepend(link);
		}
	}
);

// OLD UI

// sidbar task
clockifyButton.render(
	'.al_container .item-title-group:not(.clockify)',
	{ observe: true },
	(elem) => {
		let description = $('h3').textContent.trim();
		let project = $('h4.group-title a').textContent.trim();
		let link = clockifyButton.createButton(description, project);
		elem.parentNode.appendChild(link);
	}
);

// list
clockifyButton.render(
	'.td_content:not(.clockify)',
	{ observe: true },
	(elem) => {
		let project = $('.project_name').textContent.trim();
		let description = $('.td_description', elem).textContent.trim();
		let link = clockifyButton.createSmallButton(description, project);
		link.style.paddingTop = '0px';
		link.style.paddingTop = '10px';
		elem.parentNode.prepend(link);
	}
);

// full width view
clockifyButton.render(
	'.body_width .item-title-group:not(.clockify)',
	{ observe: true },
	(elem) => {
		let project = $('.project_name').textContent.trim();
		let description = $('h3').textContent.trim();
		let link = clockifyButton.createButton(description, project);
		elem.parentNode.appendChild(link);
	}
);

//issues
clockifyButton.render(
	'.issue_title:not(.clockify)',
	{ observe: true },
	(elem) => {
		let project = $('.project_name').textContent.trim();
		let description = $('.issue_link', elem).textContent.trim();
		let link = clockifyButton.createSmallButton(description, project);
		elem.parentNode.appendChild(link);
	}
);
