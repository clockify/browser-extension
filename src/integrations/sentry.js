clockifyButton.render('.group-detail:not(.clockify)', { observe: true }, () => {
  var link,
      issueNo = $('.short-id-box > div').textContent.trim(),
      detail = $('.group-detail h3 > span').textContent.trim(),
      project = $('[data-test-id="global-header-project-selector"] > div').textContent.trim();

  link = clockifyButton.createButton(issueNo + ': ' + detail, project);

  $('.group-detail .nav-tabs').appendChild(link);
});
