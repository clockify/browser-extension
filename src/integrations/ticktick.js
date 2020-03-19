clockifyButton.render('#task-detail-view:not(.clockify)', { observe: true }, function renderTickTick (elem) {
  function getProject () {
    const projectEl = elem.querySelector('.project-setting input');
    return projectEl ? projectEl.value.trim() : '';
  }

  function getDescription () {
    const descriptionEl = elem.querySelector('.task-title');
    return descriptionEl ? descriptionEl.textContent.trim() : '';
  }

  const button = clockifyButton.createButton(getDescription,getProject);

  const root = elem.querySelector('#td-caption');
  if (root) {
    root.insertBefore(button, root.firstChild);
  }
});