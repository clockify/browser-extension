function observe() {
  const tasksContainer = document.getElementsByClassName('tasks-container')[0];
  const taskWrappers = document.getElementsByTagName('app-list-view-task');
  const kanbanTaskWrappers = document.getElementsByTagName('app-kanban-view-task');
  const taskNumbers = document.querySelectorAll('.task-code');

  if (!tasksContainer || !taskNumbers || (!taskWrappers && !kanbanTaskWrappers)) {
    timeout = setTimeout(() => {
      observe();
    }, 2000);

    return;
  }

  addClockifyInTasksList();

  const mutationObserver = new MutationObserver(function (mutations) {
    addClockifyInTasksList();
  });

  mutationObserver.observe(tasksContainer, {
    childList: true,
  });

  taskNumbers.forEach((taskNumberElement) => {
    mutationObserver.observe(taskNumberElement, {
      childList: true,
    });
  });

  for (let i = 0; i < taskWrappers.length; i++) {
    mutationObserver.observe(taskWrappers[i], { childList: true });
  }

  for (let i = 0; i < kanbanTaskWrappers.length; i++) {
    mutationObserver.observe(kanbanTaskWrappers[i], { childList: true });
  }
}

observe();

function addClockifyInTasksList() {
  document.querySelectorAll('.task-container').forEach((elem) => {
    const project = document.getElementsByClassName('project-name')[0].textContent;
    const taskNumber = elem.querySelectorAll('.copy-task-code-button')[0]?.textContent;

    const clockifyButtonElements = elem.querySelectorAll('#clockifyButton');

    if (!taskNumber) {
      return;
    }

    if (clockifyButtonElements) {
      clockifyButtonElements.forEach((element) => element.remove());
    }

    const taskDescription = elem.querySelectorAll('.task-description')[0].textContent;

    const link = clockifyButton.createButton({ description: `${taskNumber} ${taskDescription}`, projectName: project });
    link.style.fontSize = 'inherit';
    link.style.fontFamily = 'inherit';
    link.style.color = 'inherit';
    link.style.fontSize = 0;

    const clockifyButtonElementContainer = elem.querySelectorAll('.clockify-container')[0];
    clockifyButtonElementContainer.style.background = 'none';

    clockifyButtonElementContainer.appendChild(link);
  });
}

clockifyButton.render('.task-modal:not(.clockify)', { observe: true }, function (elem) {
  const project = document.getElementsByClassName('project-name')[0].textContent;
  const taskNumber = elem.querySelectorAll('.copy-task-code-button')[0]?.textContent;
  const taskDescription = elem.querySelectorAll('h4')[0].textContent;

  const link = clockifyButton.createButton({ description: `${taskNumber} ${taskDescription}`, projectName: project });
  link.style.fontSize = 'inherit';
  link.style.fontFamily = 'inherit';
  link.style.color = 'inherit';
  link.style.fontSize = 0;

  const taskOptionsElement = elem.querySelectorAll('.task-options')[0];

  taskOptionsElement.insertBefore(link, taskOptionsElement.firstChild);
});