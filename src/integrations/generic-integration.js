/*
  renders single clockify button, at the element with the class .clockify-single-container,
  collecting data from anywhere on the page, from the elements with given classes
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
</head>
<body>
  <!--Add any elements, in any arrangement, with these classes, anywhere on your page-->
  <div class="clockify-single-container">attaches timer to this element</div>
  <h1 class="clockify-single-project">Project name</h1>
  <p class="clockify-single-description">description</p>
  <p class="clockify-single-task">task name</p>
  <div>
    <span class="clockify-single-tag">TAG 1</span>
    <span class="clockify-single-tag">TAG 2</span>
    <span class="clockify-single-tag">TAG 3</span>
  </div>
</body>
</html>
*/
clockifyButton.render(
	'.clockify-single-container:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description = $('.clockify-single-description')?.textContent || null;
		const project = $('.clockify-single-project')?.textContent || null;
		const task = $('.clockify-single-task')?.textContent || null;
		const tags = () =>
			Array.from($$('.clockify-single-tag')).map((e) => e.textContent);
		//if the target element contains the specified class then use the small version of the button
		const small = elem.classList.contains('clockify-small');

		const link = clockifyButton.createButton({
			description: description,
			projectName: project,
			taskName: task,
			tagNames: tags,
			small: small,
		});

		elem.appendChild(link);
	}
);

/* Renders multiple clockify buttons, in a list/grid of items, with the class .clockify-multi-container
rest of the elements, containing description, task and project details, must be contained within the parent element, with the .clockify-multi-container class
<div class="clockify-multi-container">
  <h1 class="clockify-multi-project">Project name</h1>
  <p class="clockify-multi-description">description</p>
  <p class="clockify-multi-task">task name</p>
  <div>
    <span class="clockify-multi-tag">TAG 1</span>
    <span class="clockify-multi-tag">TAG 2</span>
    <span class="clockify-multi-tag">TAG 3</span>
  </div>
</div>
*/
clockifyButton.render(
	'.clockify-multi-container:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description =
			$('.clockify-multi-description', elem)?.textContent || null;
		const project = $('.clockify-multi-project', elem)?.textContent || null;
		const task = $('.clockify-multi-task', elem)?.textContent || null;
		const tags = () =>
			Array.from($$('.clockify-multi-tag', elem)).map((e) => e.textContent);
		//if the target element contains the specified class then use the small version of the button
		const small = elem.classList.contains('clockify-small');

		const link = clockifyButton.createButton({
			description: description,
			projectName: project,
			taskName: task,
			tagNames: tags,
			small: small,
		});

		elem.appendChild(link);
	}
);

/*By adding data attributes to the DOM element one can control the description, project, task, tags and whether the small version of the button shall be used
example: <div class="clockify-data-container" data-description="This is the description" data-project="My Project" data-task="Task 1" data-tags="tag1,tag2,tag3" data-small></div> */
clockifyButton.render(
	'.clockify-data-container:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description =
			'description' in elem.dataset ? elem.dataset.description : '';
		const project = 'project' in elem.dataset ? elem.dataset.project : null;
		const task = 'task' in elem.dataset ? elem.dataset.task : null;
		const tags = 'tags' in elem.dataset ? elem.dataset.tags.split(',') : [];
		const small = 'small' in elem.dataset;

		const link = clockifyButton.createButton({
			description: description,
			projectName: project,
			taskName: task,
			tagNames: tags,
			small: small,
		});

		elem.appendChild(link);
	}
);
