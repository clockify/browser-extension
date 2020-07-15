// project task list
if ((window.location.href.indexOf("#project") !== -1)) {
  setTimeout(() => {
    clockifyButton.render('.task_list_item__content:not(.clockify)', {observe: true}, function (elem) {

      description = $(".task_content span", elem).innerText;
      project = $(".view_header h1 span").innerText;

      link = clockifyButton.createButton({
          description: description,
          projectName: project,
          small: true
      });

      elem.appendChild(link);
    });
  },500);
}

// filters
if ((window.location.href.indexOf("#agenda") !== -1)) {
  setTimeout(() => {
    clockifyButton.render('.task_list_item__content:not(.clockify)', {observe: true}, function (elem) {

      description = $(".task_content span", elem).innerText;
      project = $(".task_list_item__project span", elem).innerText;

      link = clockifyButton.createButton({
          description: description,
          projectName: project,
          small: true
      });

      elem.appendChild(link);
    });
  },500);
}

// task modal
if ((window.location.href.indexOf("#task") !== -1)) {
  setTimeout(() => {
    clockifyButton.render('.item_detail:not(.clockify)', {observe: true}, function (elem) {

      description = $(".task_content span", elem).innerText;
      project = $(".item_detail_parent_name", elem).innerText;

      link = clockifyButton.createButton({
          description: description,
          projectName: project
      });
      elem.insertBefore(link, elem.firstChild);
    });
  },500);
}