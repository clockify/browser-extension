clockifyButton.render('.work-item-form-headerContent:not(.clockify)', {observe: true}, function (elem) {
  var link, itemId, description, project;
  itemId =  $('.work-item-form-id > span', elem).textContent;
  description = $('.work-item-form-title input', elem).value;
  project = $(".navigation-container .project-item .text-ellipsis").textContent;
  link = clockifyButton.createButton("#" + itemId + " " + description, project);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});