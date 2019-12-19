// Inbox
clockifyButton.render('[data-test-id="sticky-subject-header"]:not(.clockify)', { observe: true }, elem => {

setTimeout(function(){ 

  const container = elem.parentElement;
  const subject = document.querySelector('[data-test-id="sticky-subject-header"]').textContent;
  const ticketId = window.location.href.split('/')[6].replace("#reply-editor", "");
  const contact = document.querySelector(".customer-data-sidebar--highlight .private-truncated-string__inner").textContent;
  const description = "[#" + ticketId + "] " + subject + " (" + contact  + ")";

  const link = clockifyButton.createButton(description);
  link.style.position = 'absolute';
  link.style.right = '0px';
  link.style.top = '45px';

  container.appendChild(link);
  }, 500);
});

// Tickets
clockifyButton.render('[data-selenium-test="highlightTitle"]:not(.clockify)', { observe: true }, elem => {

setTimeout(function(){ 

  const container = elem.parentElement;
  const ticketId = window.location.href.split('/')[6].replace("/", "");

if (document.querySelector(".width-100 a.private-link.uiLinkWithoutUnderline.uiLinkDark")) {
  contact = document.querySelector(".width-100 a.private-link.uiLinkWithoutUnderline.uiLinkDark").textContent;
  link = clockifyButton.createButton("[#" + ticketId + "] " + elem.textContent + " (" + contact + ")");
} else {
  link = clockifyButton.createButton("[#" + ticketId + "] " + elem.textContent);
}
  link.style.fontSize = '16px';
  link.style.display = 'block';

  container.appendChild(link);
  }, 500);
});
