// Inbox
clockifyButton.render('[class*="InboxColumnHeader"] [class*="UIBox"]:last-child:not(.clockify)', { observe: true }, elem => {
setTimeout(function(){ 
  const subjectEl = document.querySelector('[data-test-id="thread-list-member-row"][data-selected="true"]');
  const subject = subjectEl && subjectEl.getAttribute('aria-label') && subjectEl.getAttribute('aria-label').split('with subject ')[1];
  const contact = document.querySelector('[data-test-id="thread-list-member-row"][data-selected="true"] .private-truncated-string__inner').textContent;
  const ticketId = window.location.href.match(/inbox\/(.*)#email/)[1];
  const description = "[#" + ticketId + "] " + subject + " [" + contact + "]";
  const link = clockifyButton.createButton(description);
  link.style.position = 'relative';
  link.style.order = '-1';
  link.style.marginRight = '11px';

  elem.appendChild(link);
  }, 500);
});

// Tickets
clockifyButton.render('[data-selenium-test="highlightTitle"]:not(.clockify)', { observe: true }, elem => {

setTimeout(function(){ 

  let container = elem.parentElement;
  for(let i = 0; i = 3; i++){
    if(container.tagName.match(/H[1-4]/)){
      break;
    }
    container = container.parentElement;
  }
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
