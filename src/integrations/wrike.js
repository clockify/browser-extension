clockifyButton.render('.task-view-header__container:not(.clockify)', {observe: true}, function (elem) {
  var link, description, project;
  description = $('.title__ghost').textContent;
  project = $('.folder-tag-label__item--name').textContent;
  link = clockifyButton.createButton(description, project);
  link.style.paddingTop = "10px";
  elem.appendChild(link);
});