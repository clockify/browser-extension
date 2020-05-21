let selector = [
  "#xDetDlg > div:not(.clockify)",                      // Event card.
  "div[jsname=ssXDle] div[data-taskid]:not(.clockify)", // Task card.
].join(",");

clockifyButton.render(selector, { observe: true }, function (elem) {
  var link, description;
  description = $('[role="heading"]', elem).textContent;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.cursor = "pointer";
  link.style.position = "absolute";
  link.style.top = "0px";
  link.style.left = "30px";
  elem.appendChild(link);
});
