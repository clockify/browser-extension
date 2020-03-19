clockifyButton.render('[data-coda-ui-id="canvas"]:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = document.title;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.cursor = 'pointer';
  link.style.position = "absolute";
  link.style.top = '15px';
  link.style.left = "15px";
  elem.appendChild(link);
});