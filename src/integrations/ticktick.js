clockifyButton.render('#td-caption:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = $('[role="presentation"]', elem).textContent;
  if (elem.querySelector('#clockifyButton')) {
    elem.removeChild(elem.querySelector('#clockifyButton'));
  }
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.marginTop = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});