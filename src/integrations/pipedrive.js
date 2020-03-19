clockifyButton.render('.actionsContent:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = $('.descriptionHead h1 a', elem).textContent;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.marginTop = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});