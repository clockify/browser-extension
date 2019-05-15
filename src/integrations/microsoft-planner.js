'use strict';

clockifyButton.render('.taskCard:not(.clockify)', { observe: true }, (elem) => {
  var link,
    description = $('.title', elem).textContent;

  function getProject() {
    var plannerTaskboardName = $('.planTaskboardPage .primaryTextSection h1'),
      planName = $('.planName', elem);

    if (plannerTaskboardName) {
      return plannerTaskboardName.textContent;
    }
    if (planName) {
      return planName.textContent;
    }
    return;
  }
  link = clockifyButton.createButton(description);
  $('.leftSection', elem).appendChild(link);
});
