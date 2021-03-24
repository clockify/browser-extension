// list tasks
clockifyButton.render('.task-container:not(.clockify)', { observe: true }, function (elem) {
  const project = document.getElementsByClassName('project-name')[0].textContent;
  const taskNumber = elem.querySelectorAll('.copy-task-code-button')[0].textContent;
  const taskDescription = elem.querySelectorAll('.task-description')[0].textContent;

  const link = clockifyButton.createButton({ description: `${taskNumber} ${taskDescription}`, projectName: project });
  link.style.fontSize = 'inherit';
  link.style.fontFamily = 'inherit';
  link.style.color = 'inherit';
  link.style.fontSize = 0;

  const taskOptionsElement = elem.querySelectorAll('.task-options')[0];

  taskOptionsElement.insertBefore(link, taskOptionsElement.firstChild);
});

// task modal
clockifyButton.render('.task-modal:not(.clockify)', { observe: true }, function (elem) {
  const project = document.getElementsByClassName('project-name')[0].textContent;
  const taskNumber = elem.querySelectorAll('.copy-task-code-button')[0].textContent;
  const taskDescription = elem.querySelectorAll('h4')[0].textContent;

  const link = clockifyButton.createButton({ description: `${taskNumber} ${taskDescription}`, projectName: project });
  link.style.fontSize = 'inherit';
  link.style.fontFamily = 'inherit';
  link.style.color = 'inherit';
  link.style.fontSize = 0;

  const taskOptionsElement = elem.querySelectorAll('.task-options')[0];

  taskOptionsElement.insertBefore(link, taskOptionsElement.firstChild);
});
