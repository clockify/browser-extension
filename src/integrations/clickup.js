clockifyButton.render('.task-container .task-column__body-toolbar:not(.clockify)', {observe: true}, function (elem) {

  link = clockifyButton.createButton(document.title);
  link.style.display = "inline-flex";
  link.style.paddingLeft = "10px";
  link.style.cursor = 'pointer';

  elem.appendChild(link);
});