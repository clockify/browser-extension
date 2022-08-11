clockifyButton.render('.group-detail:not(.clockify)', { observe: true }, () => {
  var link,
      issueNo = $('.group-detail .auto-select-text > span').textContent.split("-")[1].trim(),
      detailTitle = $('.group-detail .ejrtwu50').innerHTML.split("<")[0].trim(),
      detailDescription = $('.e1rp796r0').textContent.trim(),
      project = $('.group-detail .auto-select-text > span').textContent.split("-")[0].trim();

  link = clockifyButton.createButton("#" + issueNo + ': ' + detailTitle + "-" + detailDescription, project);
  $('.group-detail .nav-tabs').appendChild(link);
});
