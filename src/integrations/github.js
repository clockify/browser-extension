// For the projects detail page
clockifyButton.render(
  'div[data-test-id="side-panel"] aside ul:not(.clockify)',
  { observe: true, noDebounce: true },
  (elem) => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.target.attributes["data-test-id"]?.value ===
          "side-panel-title"
        ) {
          const description = mutation.target.querySelector("h2 span").innerText
          const issueNum = mutation.target.querySelector("a").innerText

          const link = clockifyButton.createButton(`${issueNum} ${description}`)
          const li = document.createElement("li")
          li.style.marginLeft = "8px"
          li.style.padding = "6px 8px"
          li.style.listStyle = "none"
          li.appendChild(link)
          elem.append(li)
        }
      })
    })

    observer.observe(document.querySelector("#__primerPortalRoot__ header"), {
      childList: true,
      subtree: true,
    })
  },
  'div[data-test-id="side-panel"]'
)

// For the issues page
clockifyButton.render('.gh-header-actions:not(.clockify)', {observe: true}, function (elem) {
  issueId = $(".gh-header-number").innerText;
  description = issueId + " " + $(".js-issue-title").innerText;
  project = $("[data-pjax='#repo-content-pjax-container']").innerText;
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
