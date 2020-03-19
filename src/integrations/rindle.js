clockifyButton.render(
  '.time__tracker .toggl__container:not(.clockify)',
  { observe: true },
  function(elem) {
    var link,
      descFunc,
      projectName = $('.navbar-default .dropdown .navbar-brand .ng-scope')
        .textContent;

    descFunc = function() {
      var card = $('.toggl__card-title', elem);
      if (!!card) {
        return card.textContent;
      }
      return null;
    };
    link = clockifyButton.createButton(descFunc);

    elem.appendChild(link);
  }
);
