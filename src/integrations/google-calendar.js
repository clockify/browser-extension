clockifyButton.render(
  [
    "#xDetDlg > div:not(.clockify)", // Event card.
    "div[jsname=ssXDle] div[data-taskid]:not(.clockify)", // Task card.
  ].join(","),
  { observe: true },
  function (elem) {
    let link, description, headerElem, inputForm;
    headerElem = $('[role="heading"]', elem);
    if (!headerElem || !headerElem.textContent) return;
    let cardHeader = document.querySelector(".wv9rPe");

    const clockifyContainer = createTag('div', 'clockify-widget-container');
    description = headerElem.textContent;

    link = clockifyButton.createButton(description);
    link.style.display = "inline-flex";
    link.style.cursor = "pointer";

    inputForm = clockifyButton.createInput({
      description: description,
    });
    clockifyContainer.appendChild(link);
    clockifyContainer.appendChild(inputForm);
    cardHeader.appendChild(clockifyContainer);

    $(".clockify-widget-container").style.display = "flex";
    $(".clockify-widget-container").style.margin = "7px auto 0 3px";
    $(".clockify-widget-container").style.height = "34px";

    $('.clockify-input').style.display = "inline-block";
    $('.clockify-input').style.width = "118px";
    $('.clockify-input').style.marginLeft = "7px";
    $('.clockify-input').style.boxShadow = "none";
    $('.clockify-input').style.border = "1px solid #eaecf0";
    $('.clockify-input').style.backgroundColor = "#eaecf0";
  }
);