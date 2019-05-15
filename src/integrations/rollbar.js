'use strict';

clockifyButton.render(
  '#item-title-control:not(.clockify)',
  { observe: true },
  () => {
    const descriptionEl = $('.item-detail-page-header__item-title');
    const projectEl = $('#navbar-content > ul > li > a');
    const description = ((descriptionEl && descriptionEl.textContent) || '').trim();
    const projectName = ((projectEl && projectEl.textContent) || '').trim();
    const link = clockifyButton.createButton(description);

    $('.item-status-level-area').appendChild(link);
  }
);
