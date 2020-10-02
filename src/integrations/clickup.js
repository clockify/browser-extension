clockifyButton.render('.task-container .task-column__body-toolbar:not(.clockify)', {observe: true}, function (elem) {

  var descriptionSelector = 'div.task-name-block > cu-slash-command > div',
      projectSelector = 'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_folder.ng-star-inserted > span',
      tagSelector ='cu-tags-list > div > div > cu-tags-view > div div.cu-tags-select__name',
      taskSelector = 'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_last.breadcrumbs__link_list.ng-star-inserted > span';
    
  var link,
    description = $(descriptionSelector) ? $(descriptionSelector).textContent : "",
    task = $(taskSelector) ? $(taskSelector).textContent : "",
    project = $(projectSelector).textContent,
    tags = () => [...new Set(Array.from($$(tagSelector)).map(e => e.innerText))];

  link = clockifyButton.createButton({
    description: description,
    projectName: project,
    tagNames: tags,
    taskName: task
  });

  link.style.display = "inline-flex";
  link.style.paddingLeft = "10px";
  link.style.cursor = 'pointer';

  elem.appendChild(link);
});
