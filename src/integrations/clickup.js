setTimeout(() => {
  clockifyButton.render('.task__column.task__toolbar.task__toolbar_first:not(.clockify)', {observe: true}, function (elem) {
    var link, description, project;
    project = $("div.task-container__header.cu-hidden-print > cu-task-breadcrumbs > div > a:nth-child(4) > span").textContent;
    link = clockifyButton.createButton(document.title, project);
    link.style.display = "block";
    link.style.paddingTop = "0";
    link.style.paddingBottom = "0";
    link.style.marginBottom = "10px";
    link.style.cursor = 'pointer';
    elem.appendChild(link);
  });
}, 1000);
