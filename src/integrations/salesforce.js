if ((window.location.href.indexOf("/o/") == -1)) {
  clockifyButton.render('.slds-page-header__title:not(.clockify)', {observe: true}, (elem) => {
    setTimeout(() => {
      link = clockifyButton.createButton(document.title.replace(" | Salesforce", ""));
      if (elem.querySelector('#clockifyButton')) {
        elem.removeChild(elem.querySelector('#clockifyButton'));
      }
      link.style.position = "relative";
      link.style.left = "10px";
      elem.appendChild(link);
    }, 1000)
  });
}