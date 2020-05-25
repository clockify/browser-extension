clockifyButton.render('.pane_header:not(.clockify)', { observe: true }, function (
  elem
) {
  var link,
  projectName = $('title').textContent,
  titleElem = $('.editable .ember-view input', elem).value.trim(),
  ticketNum = location.href.match(/tickets\/(\d+)/),
  description = '#' + ticketNum[1].trim() + ' ' + titleElem;

  link = clockifyButton.createButton(description, projectName && projectName.split(' - ').shift());

  if (elem.querySelector('#clockifyButton')) {
    elem.removeChild(elem.querySelector('#clockifyButton'));
  }
  elem.insertBefore(link, elem.querySelector('.btn-group'));
});
