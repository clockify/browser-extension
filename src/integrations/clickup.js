clockifyButton.render('.task-container__header:not(.clockify)', {observe: true}, function (elem) {
  setTimeout(() => {
    var projectSelector = 'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_folder.ng-star-inserted > span',
        //tagSelector ='.task-container.ng-trigger.ng-trigger-loading div.cu-tags-select__name',
        tagSelector ='div.cu-tags-view__container div.cu-tags-select__name',
        taskSelector = 'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_last.breadcrumbs__link_list.ng-star-inserted > span';
      
    var link,
      task = $(projectSelector) ? ($(taskSelector) ? $(taskSelector).textContent : "") : "",
      project = $(projectSelector) ? $(projectSelector).textContent : ($(taskSelector) ? $(taskSelector).textContent : ""),
      tags = $(tagSelector) ? () => [...new Set(Array.from($$(tagSelector)).map(e => e.innerText))] : "";

  
    link = clockifyButton.createButton({
      description: document.title,
      projectName: project,
      tagNames: tags,
      taskName: task
    });
  
    link.style.display = "inline-flex";
    link.style.paddingLeft = "10px";
    link.style.cursor = 'pointer';
  
    elem.appendChild(link);

  }, 2000);
});