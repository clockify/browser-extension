clockifyButton.render('#Pagearea:not(.clockify)', { observe: true }, (elem) => {
  var link,
    container = createTag('li', 'ticket-btns'),
    description,
    titleElem = $('h2.subject', elem),
    idElem = $('#ticket-display-id'),
    projectElem = $('.logo_text'),
    buttonsElem = $('.ticket-actions > ul');

  description = idElem.textContent.trim() + ' ' + titleElem.textContent.trim();

    link = clockifyButton.createButton(description);

    container.appendChild(link);
    buttonsElem.appendChild(container, buttonsElem);
});

// Freshdesk mint (late 2018)
clockifyButton.render('.page-actions__left:not(.clockify)', { observe: true }, (elem) => {
  const descriptionElem = $('.ticket-subject-heading');

  // if there's no description element it's overview page, don't show
  if (!descriptionElem) { return }

  const descriptionSelector = () => {
    const ticketNumber = $('.breadcrumb__item.active').textContent.trim();
    const subject = $('.ticket-subject-heading').textContent.trim();
    const fullcopy = "[#" + ticketNumber + "] " + subject;

    return fullcopy;
  };

  const link = clockifyButton.createButton(descriptionSelector);

  elem.appendChild(link);
});