'use strict';

clockifyButton.render('.group-detail:not(.clockify)', { observe: true }, () => {
  var link,
    errType = $('h3 > span > span').textContent.trim(),
    detail = $('.message').textContent.trim();

  link = clockifyButton.createButton(errType + ': ' + detail);

  $('.group-detail .nav-tabs').appendChild(link);
});
