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
  var descriptionElem = $('.ticket-subject-heading');

  // if there's no description element it's overview page, don't show
  if (!descriptionElem) { return }

  var ticketNumber = $('.breadcrumb__item.active').textContent.trim(),
  subject = $('.ticket-subject-heading').textContent.trim(),

  link = clockifyButton.createButton("[#" + ticketNumber + "] " + subject);
  elem.appendChild(link);
});
