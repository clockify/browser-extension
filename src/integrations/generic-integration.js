console.log('[Clockify] Generic integration injected.');

/*
 *  Renders single clockify button, at the element with the class .clockify-single-container,
 *  collecting data from anywhere on the page, from the elements with given classes:
	
     <!--Add any elements, in any arrangement, with these classes, anywhere on your page-->
     <div class="clockify-single-container">attaches timer to this element</div>
     <h1 class="clockify-single-project">Project name</h1>
     <p class="clockify-single-description">Description</p>
     <p class="clockify-single-task">Task name</p>
     <div>
       <span class="clockify-single-tag">TAG 1</span>
       <span class="clockify-single-tag">TAG 2</span>
       <span class="clockify-single-tag">TAG 3</span>
     </div>
 */
clockifyButton.render('.clockify-single-container:not(.clockify)', { observe: true }, container => {
	const description = () => text('.clockify-single-description');
	const projectName = () => text('.clockify-single-project');
	const taskName = () => text('.clockify-single-task');
	const tagNames = () => textList('.clockify-single-tag');

	// if the target element contains "clockify-small" class, small button will be displayed
	const small = container.classList.contains('clockify-small');

	const entry = { description, projectName, taskName, tagNames, small };

	const timer = clockifyButton.createTimer(entry);

	container.append(timer);
});

/* Renders multiple clockify buttons, in a list/grid of items, with the class .clockify-multi-container,
 * rest of the elements, containing description, task and project details, must be contained within 
 * the parent element, with the .clockify-multi-container class:
  
   <div class="clockify-multi-container">
    <h1 class="clockify-multi-project">Project name</h1>
    <p class="clockify-multi-description">Description</p>
    <p class="clockify-multi-task">Task name</p>
    <div>
      <span class="clockify-multi-tag">TAG 1</span>
      <span class="clockify-multi-tag">TAG 2</span>
      <span class="clockify-multi-tag">TAG 3</span>
    </div>
   </div>
 */
clockifyButton.render('.clockify-multi-container:not(.clockify)', { observe: true }, container => {
	const description = () => text('.clockify-multi-description', container);
	const projectName = () => text('.clockify-multi-project', container);
	const taskName = () => text('.clockify-multi-task', container);
	const tagNames = () => textList('.clockify-multi-tag', container);

	// if the target element contains "clockify-small" class, small button will be displayed
	const small = container.classList.contains('clockify-small');

	const entry = { description, projectName, taskName, tagNames, small };

	const timer = clockifyButton.createTimer(entry);

	container.append(timer);
});

/* 
 * By adding data attributes to the DOM element one can control the description, 
 * project, task, tags and whether the small version of the button shall be used:
   
   <div class="clockify-data-container" 
   	data-description="This is the description" 
   	data-project="My Project" 
   	data-task="Task 1" 
   	data-tags="tag1,tag2,tag3" data-small>
   </div>
 */
clockifyButton.render('.clockify-data-container:not(.clockify)', { observe: true }, container => {
	const description = () => attribute('data-description', container);
	const projectName = () => attribute('data-project', container);
	const taskName = () => attribute('data-task', container);
	const tagNames = () => attribute('data-tags', container)?.split(',') || [];

	// if the target element contains "data-small" attribute, small button will be displayed
	const small = 'small' in container.dataset;

	const entry = { description, projectName, taskName, tagNames, small };

	const timer = clockifyButton.createTimer(entry);

	container.append(timer);
});
