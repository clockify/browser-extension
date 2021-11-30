clockifyButton.render('.gh-header-actions:not(.clockify)', {observe: true}, function (elem) {
  issueId = $(".gh-header-number").innerText;
  description = issueId + " " + $(".js-issue-title").innerText;
  // project = $("[data-pjax='#js-repo-pjax-container']").innerText;
  project = $("[data-pjax='#repo-content-pjax-container']").innerText;

  // 
  tags = () => Array.from($$(".IssueLabel")).map(e => e.innerText),

  link = clockifyButton.createButton({
      description: description,
      projectName: project,
      taskName: description,
      tagNames: tags
  });
  inputForm = clockifyButton.createInput({
        description: description,
        projectName: project,
        taskName: description,
        tagNames: tags
  });

  link.style.padding = "3px 14px";
  elem.prepend(link);
  elem.prepend(inputForm);
});
