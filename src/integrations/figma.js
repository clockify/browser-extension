clockifyButton.render('.multiplayer_view--multiplayerView--19Y20:not(.clockify)', {observe: true}, function (elem) {

  const description = document.title.replace(" – Figma", "");
  let project = $('[data-tooltip-key="editor-folder-name"]')
  project = project && project.innerText;
  const link = clockifyButton.createSmallButton(description, project);
  elem.prepend(link);

});