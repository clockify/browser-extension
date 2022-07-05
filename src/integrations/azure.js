clockifyButton.render('.work-item-form-headerContent:not(.clockify,.flex-row)', {observe: true}, function (elem) {
  var link, itemId, description, project, tagNames;
  itemId = () => $('.work-item-form-id > span', elem).textContent;
  description = () => $('.work-item-form-title input', elem).value;
  project = $("input[aria-label='Clockify Project']") ? $("input[aria-label='Clockify Project']").value : $(".navigation-container .project-item .text-ellipsis").textContent;
  tagNames = () => Array.from($$(".tags-items-container .tag-item:not(.tags-add-button) .tag-box")).map(e => e.innerText);
  link = clockifyButton.createButton({
      description: () => "#" + itemId() + " " + description(),
      projectName: project,
      taskName: () => description(),
  });
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.cursor = 'pointer';
  link.style.width = 'fit-content';
  elem.appendChild(link);
});

clockifyButton.render('.work-item-form-header:not(.clockify,.flex-row)', {observe: true}, function (elem) {
  var link, itemId, description, project;
  itemId = () => $('.work-item-form-header > .body-xl', elem).textContent;
  description = () => $('.work-item-title-textfield input', elem).value;
  project = $("input[aria-label='Clockify Project']") ? $("input[aria-label='Clockify Project']").value : $(".navigation-container .project-item .text-ellipsis").textContent;
  link = clockifyButton.createButton({
      description: () => "#" + itemId() + " " + description(),
      projectName: project,
      taskName: () => description()
  });
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.cursor = 'pointer';
  link.style.width = 'fit-content';
  
  elem.appendChild(link);
});
