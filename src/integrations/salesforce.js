if ((window.location.href.indexOf("/o/") == -1)) {  
  clockifyButton.render('.slds-page-header__title:not(.clockify)', {observe: true}, (elem) => {
    setTimeout(() => {      
      var description;
      var objectIdRegex = /\b[a-z0-9]\w{4}0\w{12}|[a-z0-9]\w{4}0\w{9}\b/;
      var matches = window.location.href.match(objectIdRegex);    
      if (matches.length > 0) {
        description = "#" + matches[0] + " ";
      }
      
      description += document.title.replace(" | Salesforce", "")
      link = clockifyButton.createButton(description);
      if (elem.querySelector('#clockifyButton')) {
        elem.removeChild(elem.querySelector('#clockifyButton'));
      }
      link.style.position = "relative";
      link.style.left = "10px";
      elem.appendChild(link);
    }, 1000)
  });
}
