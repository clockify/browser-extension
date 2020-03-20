clockifyButton.render('.pane_header:not(.clockify)', { observe: true }, function (
  elem
) {
  let description;
  const projectName = $('title').textContent.split(' - ').shift();

  const titleFunc = function () {
    const titleElem = $('[data-test-id="header-tab-title"]');
    const ticketNum = location.href.match(/tickets\/(\d+)/);

    if (titleElem !== null) {
      description = titleElem.textContent.trim();
    }

    if (ticketNum) {
      description = '#' + ticketNum[1].trim() + ' ' + description;
    }
    return description;
  };

  const link = clockifyButton.createButton(titleFunc, projectName);

  if (elem.querySelector('#clockifyButton')) {
    elem.removeChild(elem.querySelector('#clockifyButton'));
  }

  elem.insertBefore(link, elem.querySelector('.btn-group'));
});
