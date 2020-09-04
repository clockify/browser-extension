// projects
clockifyButton.render('.project_editor_instance [data-action-hint="task-root"]:not(.clockify)', {observe: true}, function (elem) {
  description = $('.markdown_content.task_content', elem).textContent;
  project = $('.view_header__content h1').textContent;
  link = clockifyButton.createButton({
      description: description,
      projectName: project,
      small: true
  });
  link.style.paddingRight = "10px";
  elem.prepend(link);
});

// // task modal
clockifyButton.render('.detail_modal:not(.clockify)', {observe: true}, function (elem) {
  description = $(".item_detail .task_content").innerText;
  project = $(".item_detail_parent_name").innerText;

  link = clockifyButton.createButton({
      description: description,
      projectName: project
  });
  link.style.padding = "20px 25px 0px";
  elem.insertBefore(link, elem.firstChild);
});

// // filters
clockifyButton.render('#agenda_view [data-action-hint="task-root"]:not(.clockify)', {observe: true}, function (elem) {
  description = $('.markdown_content.task_content', elem).textContent;
  project = $('.task_list_item__project', elem).textContent;
  link = clockifyButton.createButton({
      description: description,
      projectName: project,
      small: true
  });
  link.style.paddingRight = "10px";
  elem.prepend(link);
});

// // calendar
clockifyButton.render('.upcoming_view__list [data-action-hint="task-root"]:not(.clockify)', {observe: true}, function (elem) {
  description = $('.markdown_content.task_content', elem).textContent;
  project = $('.task_list_item__project', elem).textContent;
  link = clockifyButton.createButton({
      description: description,
      projectName: project,
      small: true
  });
  link.style.paddingRight = "10px";
  elem.prepend(link);
});

// filters
clockifyButton.render('.filter_view .task_list_item__body:not(.clockify)', {observe: true}, function (elem) {
  description = $('.markdown_content.task_content', elem).textContent;
  project = $('.task_list_item__project', elem).textContent;
  link = clockifyButton.createButton({
      description: description,
      projectName: project,
      small: true
  });
  link.style.paddingRight = "10px";
  elem.prepend(link);
});
