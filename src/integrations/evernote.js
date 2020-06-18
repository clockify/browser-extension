clockifyButton.render('#qa-NOTE_HEADER:not(.clockify)', { observe: true }, function (elem) {
  if (elem.querySelector('#clockifyButton')) {
    return;
  }

  const projectFunc = function () {
    const projectElem = $('#qa-NOTE_PARENT_NOTEBOOK_BTN');
    return projectElem ? projectElem.textContent : '';
  };

  const descriptionFunc = function () {
    const descriptionElem = $('.qC87s8opH1X3hjuzPoKrl span span');
    return descriptionElem ? descriptionElem.textContent.trim() : '';
  };

  const link = clockifyButton.createButton({
    projectName: projectFunc,
    description: descriptionFunc
  });

  elem.querySelector('#qa-SHARE_BUTTON').parentNode.prepend(link);
});