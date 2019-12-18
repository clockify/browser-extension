// Inbox
clockifyButton.render('[data-test-id="sticky-subject-header"]:not(.clockify)', { observe: true }, elem => {
  const container = elem.parentElement;

  const link = clockifyButton.createButton(elem.textContent);
  link.style.position = 'absolute';
  link.style.right = '0px';
  link.style.top = '45px';


  container.appendChild(link);
});

// Tickets
clockifyButton.render('[data-selenium-test="highlightTitle"]:not(.clockify)', { observe: true }, elem => {
  const container = elem.parentElement;
  const company = document.querySelector("[data-selenium-test='company-chicklet-title'] span").textContent;

  const link = clockifyButton.createButton(elem.textContent, company);
  link.style.fontSize = '16px';
  link.style.display = 'block';

  container.appendChild(link);
});
