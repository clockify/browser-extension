clockifyButton.render(
  'body.controller-issues.action-show h2:not(.clockify)',
  {},
  (elem) => {
    var link,
      description,
      numElem = $('h2'),
      titleElem = $('.subject h3') || '',
      projectElem = $('h1');

    if (!!$('.clockify-button')) {
      return;
    }

    if (!!titleElem) {
      description = titleElem.textContent;
    }

    if (numElem !== null) {
      if (!!description) {
        description = ' ' + description;
      }
      description = numElem.textContent + description;
    }
      link = clockifyButton.createButton(description);
      link.style.marginLeft = "10px";

      $('h2').appendChild(link);
  }
);
