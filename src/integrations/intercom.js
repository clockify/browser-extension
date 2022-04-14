clockifyButton.render('.conversation__card__content-expanded__controls .inbox__conversation-controls__pane-selector:not(.clockify)', { observe: true }, function (elem) {
  if (elem.querySelector('.clockify-button')) {
    return;
  }

  const descriptionSelector = () => {
    const description = $('.ember-view.attribute__label-wrapper.u__one-truncated-line.t__solo-link.t__h4');
    return description ? description.textContent.trim().replace(/ +/g, ' ') : '';
  };
  const projectSelector = () => {
    const project = $('div.layout__box.o__centers-vertically.o__flexes-to-1.inbox__user-profile__user-details-title > div > div.c__deemphasized-text > span > span > a > span');
    return project ? project.textContent.trim().replace(/ +/g, ' ') : '';
  };

  const link = clockifyButton.createButton(descriptionSelector, projectSelector);
  link.style.textDecoration = 'none';
  link.style.position = 'relative';
  link.style.top = '7px';
  link.style.right = '10px';

  if (elem.querySelector('#clockifyButton')) {
    elem.removeChild(elem.querySelector('#clockifyButton'));
  }

  link.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  elem.appendChild(link);
});

clockifyButton.render('.articles__editor__header-text:not(.clockify)', { observe: true }, function (elem) {
  const descriptionSelector = () => {
    const description = elem.textContent;
    return description ? description.trim().replace(" " + clockifyLocales.START_TIMER, "") : '';
  };

  const link = clockifyButton.createButton(descriptionSelector);
  link.style.margin = '3px 15px';
  link.style.textDecoration = 'none';

  elem.appendChild(link);
});