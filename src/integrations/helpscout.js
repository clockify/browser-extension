clockifyButton.render('.convo-actions:not(.clockify)', { observe: true }, () => {
  var link,
    description =
      '#' +
      $('#tkHeader strong').textContent +
      ' ' +
      $('#subjectLine').textContent;

    link = clockifyButton.createSmallButton(description);
    link.style.marginTop = "3px";

    var listItem = document.createElement('li');
    listItem.appendChild(link);

    $('.convo-actions').appendChild(listItem);
});
