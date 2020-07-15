setTimeout(() => {
  clockifyButton.render('.pane_header:not(.clockify)', { observe: true }, function (elem) {
    let description;
    const projectName = $('title').textContent;
  
    const titleFunc = function () {
      const titleElem = $('.editable .ember-view input', elem);
      const ticketNum = location.href.match(/tickets\/(\d+)/);
  
      if (titleElem !== null) {
        description = titleElem.value.trim();
      }
  
      if (ticketNum) {
        description = '#' + ticketNum[1].trim() + ' ' + description;
      }
      return description;
    };
  
    console.log("zendesk create button");
    const link = clockifyButton.createButton(titleFunc, projectName && projectName.split(' - ').shift());
  
    if (elem.querySelector('#clockifyButton')) {
      elem.removeChild(elem.querySelector('#clockifyButton'));
    }
  
    elem.insertBefore(link, elem.querySelector('.btn-group'));
  });
}, 1000)
