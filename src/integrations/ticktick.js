'use strict';

clockifyButton.render('#task-detail-view:not(.clockify)', { observe: true }, (elem) => {
  var text = $('.task-title', elem).textContent,
  link = clockifyButton.createButton(text);

  $('#tasktitle').appendChild(link);
});
