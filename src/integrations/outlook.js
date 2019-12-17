// Inbox emails
clockifyButton.render('[aria-label="Content pane"] [role="heading"] span:not(.clockify)', { observe: true }, elem => {
  const container = elem.parentElement;

  const link = clockifyButton.createButton(elem.textContent);
  link.style.marginLeft = "10px";

  container.appendChild(link);
});

// Composing emails
clockifyButton.render('[aria-label="Command toolbar"] .ms-CommandBar-primaryCommand:not(.clockify)', { observe: true }, elem => {
  const isComposingEmail = elem.querySelector('button[name="Send"]');

  if (isComposingEmail) {
    const subject = () => document.querySelector('[aria-label="Add a subject"]').value;

    const link = clockifyButton.createButton(subject);
    link.style.marginLeft = "10px";

    elem.appendChild(link);
  }
});
