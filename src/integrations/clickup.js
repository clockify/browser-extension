setTimeout(() => {
  clockifyButton.render('.task__column.task__toolbar.task__toolbar_first:not(.clockify)', {observe: true}, function (elem) {
    var link, description, project;
    project = $("div.task-container__header.cu-hidden-print > cu-task-breadcrumbs > div > a:nth-child(4) > span").textContent;
    task = $("cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_last.ng-star-inserted > span").textContent;
    link = clockifyButton.createButton({
        description: document.title,
        projectName: project,
        taskName: task
    });
    link.style.display = "block";
    link.style.paddingTop = "0";
    link.style.paddingBottom = "0";
    link.style.marginBottom = "10px";
    link.style.cursor = 'pointer';
    elem.appendChild(link);
  });
}, 1000);