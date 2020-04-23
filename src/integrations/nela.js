clockifyButton.render('.modal-content .card-body .card-title:not(.clockify)', { observe: true }, (elem) => {
  if(document.getElementById('clockifyButton')) {
    document.getElementById('clockifyButton').remove();
  }

  const container = elem.querySelector('h6');

  const alias = container.innerText.trim();
  const task = elem.querySelector('div').innerText.trim();

  // Try to find the project
  let project = document.querySelector('.kb-board .kb-header h4');
  if(project) {
    project = project.innerText.trim();
  } else {
    project = '';
  }

  const link = clockifyButton.createButton(`${alias}: ${task}`, project);
  link.classList.add('position-relative', 'pl-3', 'ml-3');

  container.appendChild(link);
});

clockifyButton.render('.modal-content .modal-body.rounded-lg:not(.clockify)', { observe: true }, (elem) => {
  if(document.getElementById('clockifyButton')) {
    document.getElementById('clockifyButton').remove();
  }

  const container = elem.querySelector('h6');

  const [alias] = container.innerText.trim().split(' ');
  let task = document.getElementById('task-title').value;

  if(task) {
    task = task.trim();
  }

  // Try to find the project
  let project = document.querySelector('.header-filter .card-body h5');
  if(project) {
    project = project.innerText.trim();
  } else {
    project = '';
  }

  const link = clockifyButton.createButton(`${alias}: ${task}`, project);
  link.classList.add('position-relative', 'pl-3', 'ml-3');

  container.appendChild(link);
});
