clockifyButton.render('.convo-actions:not(.clockify)', { observe: true }, () => {
  var link,
    description =
      '#' +
      $('#tkHeader strong').textContent +
      ' ' +
      $('#subjectLine').textContent;

    link = clockifyButton.createSmallButton(description);

    var listItem = document.createElement('li');
    listItem.appendChild(link);

    $('.convo-actions').appendChild(listItem);

    // Fix alignment
    document.head.insertAdjacentHTML("beforeend",
    `<style type="text/css">
      a.small.clockify-button-active,
      a.small.clockify-button-inactive {
        margin: 0;
      }

      .convo-actions > li:last-child {
        display: inline-flex;
        justify-content: flex-start;
        align-items: center;
      }
    </style>`)
});
