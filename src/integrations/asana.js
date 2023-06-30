getProject = () => {
	const currentlyOpenedSectionTitle = $('[class*="TopbarPageHeader"][class*="Typography--h4"]');
	const firstProjectInListInOpenTask = $('.TaskPane .TaskProjectToken .TokenizerPillBase-name');
	const replaceNbspsInString = (str) => {
		const regex = new RegExp(String.fromCharCode(160), "g");
		return str.replace(regex, " ");
	}
	let project;
	if (currentlyOpenedSectionTitle) {
		const currentlyOpenedSectionTitleText = replaceNbspsInString(currentlyOpenedSectionTitle.innerText);
		const allProjectsListInOpenTask = Array.from($$('.TaskPane .TaskProjectToken .TokenizerPillBase-name'));
		const allProjectsListInOpenTaskNames = allProjectsListInOpenTask.map(project => project.innerText);
		project = allProjectsListInOpenTaskNames.includes(currentlyOpenedSectionTitleText) ? currentlyOpenedSectionTitle : firstProjectInListInOpenTask;
	}
	if (!project) {
		project = $(
			'div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskProjects .TokenizerPillBase-name'
		);
		if (!project) project = $('.TaskPane .TaskAncestry-ancestorProjects');
		if (!project)
			// project = $('h1.TopbarPageHeaderStructure-title')
			project = $(
				'div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskAncestry-ancestorProjects'
			);
		if (!project)
			//asana inbox
			project = $(
				'div.Pane.Inbox-pane.Inbox-detailsPane .TaskProjects-projectList .TokenizerPillBase-name'
			);
	}
	return project;
};

getTask = () => {
	const containerElem = $('.TaskPane');
	//if the user can only see the task name and not edit it (permissions) then the textarea will not be there
	const taskSelector = $('.TaskPane-titleRow textarea') ?? $('.TaskPane-titleRow')?.firstChild;
	const subTask = $(
		'.TaskAncestry-ancestorLink.SecondaryNavigationLink',
		containerElem
	);
	const mainTask = taskSelector ? taskSelector.textContent : null;
	const taskName = () => {
		const subTaskName = subTask ? subTask.textContent : null;
		return subTaskName ?? mainTask;
	};
	console.log({ description: mainTask ?? '', taskName: taskName() });
	return { description: mainTask ?? '', taskName: taskName() };
};

function createClockifyElements() {
	const containerElem = $('.TaskPane');
	const clockifyButtonElement = $('#clockifyButton');
	const clockifyInputElement = $('.clockify-input-container');
	if (clockifyButtonElement) clockifyButtonElement.remove();
	if (clockifyInputElement) clockifyInputElement.remove();
	container = $('.TaskPane-body', containerElem);
	const tags = () =>
		[
			...$$('ul.TaskTagTokenPills span.TokenizerPillBase-name', containerElem),
		].map((e) => e.innerText);

	const clockifyContainer = createTag('div', 'clockify-widget-container');
	project = getProject();
	link = clockifyButton.createButton({
		description: () => {
			return getTask().description;
		},
		projectName: project ? project.textContent : null,
		taskName: () => {
			return getTask().taskName;
		},
		tagNames: tags,
	});
	clockifyContainer.appendChild(link);

	const htmlTagInput = createTag('div', 'clockify-input-container');
	const inputForm = clockifyButton.createInput({
		description: () => {
			return getTask().description;
		},
		projectName: project ? project.textContent : null,
		taskName: () => {
			return getTask().taskName;
		},
		tagNames: tags,
	});
	htmlTagInput.append(inputForm);
	clockifyContainer.appendChild(htmlTagInput);
	container.prepend(clockifyContainer);
	$('.clockify-widget-container').style.display = 'flex';
	$('.clockify-widget-container').style.margin = '10px 0px 10px 0px';
	$('.clockify-widget-container').style.height = '34px';

	$('.clockify-input').style.width = '100%';
	$('.clockify-input').style.boxShadow = 'none';
	$('.clockify-input').style.border = '1px solid #eaecf0';
	$('.clockify-input').style.marginLeft = '10px';
	$('.clockify-input').style.padding = '0 8px';
	$('.clockify-input').style.fontSize = '12px';
	$('.clockify-input').style.borderRadius = '5px';
}

function observeProjects() {
	const projectList = $('.TaskProjects-projectList');
	if (projectList) {
		const projectListObserver = new MutationObserver(
			clockifyDebounce(function (mutationList, observer) {
				createClockifyElements();
			})
		);
		projectListObserver.observe(projectList, { childList: true });
	}
}

// New task pane list detail modal
setTimeout(() => {
	clockifyButton.render(
		'.TaskPane:not(.clockify)',
		{ observe: true },
		(elem) => {
			createClockifyElements();
		}
	);
}, 500);

// subtasks
setTimeout(() => {
	clockifyButton.render(
		'.SubtaskTaskRow:not(.clockify)',
		{ observe: true },
		(elem) => {
			let appendElementsTo = $('.ItemRowTwoColumnStructure-left', elem);
			const containerElem = $('.TaskPane');
			//if the user can only see the task name and not edit it (permissions) then the textarea will not be there
			const taskSelector = $('.TaskPane-titleRow textarea') ?? $('.TaskPane-titleRow')?.firstChild;
			const mainTask = taskSelector ? taskSelector.textContent : null;
			const subTask = () => $('textarea', appendElementsTo).textContent;
			const clockifyElements = createTag('div', 'clockify-elements-container');
			description = () => subTask() ?? '';
			project = getProject();
			taskName = () => subTask() ?? mainTask;
			const tags = () =>
				[
					...$$(
						'ul.TaskTagTokenPills span.TokenizerPillBase-name',
						containerElem
					),
				].map((e) => e.innerText);
			const link = clockifyButton.createButton({
				description,
				projectName: project ? project.textContent : null,
				taskName,
				tagNames: tags,
			});

			appendElementsTo.style.width = '100%';
			clockifyElements.style.marginLeft = 'auto';
			clockifyElements.appendChild(link);
			const clockifyElementsContainer = $('.clockify-elements-container', elem);
			if (clockifyElementsContainer) {
				clockifyElementsContainer.remove();
			}
			appendElementsTo.appendChild(clockifyElements);
		}
	);
}, 500);

// comment only subtasks
setTimeout(() => {
	clockifyButton.render(
		'.CommentOnlySubtaskTaskRow:not(.clockify)',
		{ observe: true },
		(elem) => {
			let appendElementsTo = $('.CommentOnlySubtaskTaskRow-detailsButton', elem);
			const containerElem = $('.TaskPane');
			//if the user can only see the task name and not edit it (permissions) then the textarea will not be there
			const taskSelector = $('.TaskPane-titleRow textarea', containerElem) ?? $('.TaskPane-titleRow', containerElem)?.firstChild;
			const mainTask = taskSelector ? taskSelector.textContent : null;
			const subTask = () => $('.CommentOnlySubtaskTaskRow-name', elem).textContent;
			const clockifyElements = createTag('div', 'clockify-elements-container');
			description = () => subTask() ?? '';
			project = getProject();
			taskName = () => subTask() ?? mainTask;
			const tags = () =>
				[
					...$$(
						'ul.TaskTagTokenPills span.TokenizerPillBase-name',
						containerElem
					),
				].map((e) => e.innerText);
			const link = clockifyButton.createButton({
				description,
				projectName: project ? project.textContent : null,
				taskName,
				tagNames: tags,
			});

			link.style.marginLeft = '10px';
			clockifyElements.prepend(link);
			const clockifyElementsContainer = $('.clockify-elements-container', elem);
			if (clockifyElementsContainer) {
				clockifyElementsContainer.remove();
			}
			appendElementsTo.appendChild(clockifyElements);
		}
	);
}, 500);

if (window.observeProjectsTimeout) clearTimeout(window.observeProjectsTimeout);

window.observeProjectsTimeout = setTimeout(() => observeProjects(), 1000);
