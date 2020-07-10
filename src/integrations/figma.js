clockifyButton.render('.multiplayer_view--multiplayerView--19Y20:not(.clockify)', {observe: true}, function (elem) {

  description = document.title.replace(" – Figma", "");
  project = $('[data-tooltip-key="editor-folder-name"]').innerText;
  link = clockifyButton.createSmallButton(description, project);
  elem.prepend(link);

});