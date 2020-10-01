clockifyButton.render(
  [
    "#xDetDlg > div:not(.clockify)", // Event card.
    "div[jsname=ssXDle] div[data-taskid]:not(.clockify)", // Task card.
  ].join(","),
  { observe: true },
  function (elem) {
    var link, description, headerElem;
    headerElem = $('[role="heading"]', elem);
    if (!headerElem || !headerElem.textContent) return;
    description = headerElem.textContent;
    link = clockifyButton.createButton(description);
    link.style.display = "block";
    link.style.cursor = "pointer";
    link.style.position = "absolute";
    link.style.top = "15px";
    link.style.left = "30px";
    elem.appendChild(link);
  }
);