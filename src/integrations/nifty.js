removeAllButtons();

clockifyButton.render(
  ".project-main .tasks-view-holder .content-panel-holder .content-panel-head:not(.clockify)",
  { observe: true },
  elem => {
    let link;

    let projectName = document
      .querySelector(".header-title h1")
      .innerText.trim();

    let taskName =
      document
        .querySelector(".content-panel-title .content-panel-field-input")
        .innerHTML.trim() || false;

    let taskID =
      document.querySelector(".content-panel-head .nice-id").innerText || false;

    if (!taskName || !taskID) {
      return;
    }

    link = clockifyButton.createButton(`#${taskID} ${taskName}`, projectName);

    elem.appendChild(link);
  }
);
