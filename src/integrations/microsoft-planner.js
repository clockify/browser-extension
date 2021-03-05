clockifyButton.render('.taskCard:not(.clockify)', { observe: true }, (elem) => {
  var link,
    description = $('.title', elem).textContent;

  function getProject() {
    var plannerTaskboardName = $('.planTaskboardPage .primaryTextSection h1'),
      planName = $('.planName', elem),
      plannerTaskboardName3 = $('.tasksBoardPage .primaryTextSectionTitle');

    if (plannerTaskboardName) {
      return plannerTaskboardName.textContent;
    }
    if (planName) {
      return planName.textContent;
    }
    if (plannerTaskboardName3) {
      return plannerTaskboardName3.textContent;
    }
    return;
  }
  link = clockifyButton.createButton(description, getProject());
  $('.leftSection', elem).appendChild(link);
});
