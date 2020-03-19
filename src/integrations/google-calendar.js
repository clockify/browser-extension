clockifyButton.render('#xDetDlg > div:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = $('[role="heading"]', elem).textContent;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.cursor = 'pointer';
  link.style.position = 'absolute';
  link.style.top = '0px';
  link.style.left = '30px';
  elem.appendChild(link);
});