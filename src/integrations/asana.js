getProject = () => {
  let project = $(
    ".TaskPane .TaskProjectToken .TokenizerPillBase-name"
  );
  if (!project) {
    project = $(
      "div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskProjects .TokenizerPillBase-name"
    );
    if (!project)
      project = $(".TaskPane .TaskAncestry-ancestorProjects");
    if (!project)
      // project = $('h1.TopbarPageHeaderStructure-title')
      project = $(
        "div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskAncestry-ancestorProjects"
      );
    if (!project)
      //asana inbox
      project = $(
        "div.Pane.Inbox-pane.Inbox-detailsPane .TaskProjects-projectList .TokenizerPillBase-name"
      );
  }
  return project;
};

function createClockifyElements() {
  const containerElem = $(".TaskPane");
  const clockifyButtonElement = $("#clockifyButton");
  const clockifyInputElement = $(".clockify-input-container");
  if (clockifyButtonElement) clockifyButtonElement.remove();
  if (clockifyInputElement) clockifyInputElement.remove();

  const taskSelector = $(".TaskPane-titleRow textarea"),
        subTask = $(".TaskAncestry-ancestorLink.SecondaryNavigationLink", containerElem),
        mainTask = taskSelector ? taskSelector.textContent : null,
        taskName = () => {
          const subTaskName = subTask ? subTask.textContent : null;
          return subTaskName ?? mainTask;
        },
        container = $(".TaskPane-body", containerElem),
        description = () => mainTask ?? "";
      const tags = () =>
        Array.from(
          $$("ul.TaskTagTokenPills span.TokenizerPillBase-name", containerElem)
        ).map((e) => e.innerText);

      const clockifyContainer = createTag('div', 'clockify-widget-container');
      project = getProject();
      link = clockifyButton.createButton({
        description,
        projectName: project ? project.textContent : null,
        taskName,
        tagNames: tags,
      });
      clockifyContainer.appendChild(link);

      const htmlTagInput = createTag("div", "clockify-input-container");
      const inputForm = clockifyButton.createInput({
        description,
        projectName: project ? project.textContent : null,
        taskName,
        tagNames: tags,
      });
      htmlTagInput.append(inputForm);
      clockifyContainer.appendChild(htmlTagInput);
      container.prepend(clockifyContainer);
      $(".clockify-widget-container").style.display = "flex";
      $(".clockify-widget-container").style.margin = "10px 0px -10px 0px";
      $(".clockify-widget-container").style.height = "34px";

      $(".clockify-input").style.width = "100%";
      $(".clockify-input").style.boxShadow = "none";
      $(".clockify-input").style.border = "1px solid #eaecf0";
      $(".clockify-input").style.marginLeft = "10px";
      $(".clockify-input").style.padding = "0 8px";
      $(".clockify-input").style.fontSize = "12px";
      $(".clockify-input").style.borderRadius = "5px";
}

function observeProjects() {
  const projectList = $(".TaskProjects-projectList");
  if (projectList) {
    const projectListObserver = new MutationObserver(clockifyDebounce(function (
      mutationList,
      observer
    ) {
      createClockifyElements();
    }));
    projectListObserver.observe(projectList, { childList: true });
  }
}

// New task pane list detail modal
setTimeout(() => {
  clockifyButton.render(
    ".TaskPane:not(.clockify)",
    { observe: true },
    (elem) => {
      createClockifyElements();
    }
  );
}, 500);

// subtasks
setTimeout(() => {
  clockifyButton.render(".SubtaskTaskRow:not(.clockify)", {observe: true}, (elem) => {
    let appendElementsTo = $(".ItemRowTwoColumnStructure-left", elem);
    const containerElem = $(".TaskPane");
    const taskSelector = $(".TaskPane-titleRow textarea");
    const mainTask = taskSelector ? taskSelector.textContent : null;
    const subTask = $("textarea", appendElementsTo).textContent;
    const clockifyElements = createTag("div", "clockify-elements-container");
    description = () => subTask ?? "";
    project = getProject();
    taskName = () => {
      const subTaskName = subTask || null;
      return subTaskName ?? mainTask;
    };
    const tags = () =>
        Array.from(
          $$("ul.TaskTagTokenPills span.TokenizerPillBase-name", containerElem)
        ).map((e) => e.innerText);
    const link = clockifyButton.createButton({
      description,
      projectName: project ? project.textContent : null,
      taskName,
      tagNames: tags,
    });

    appendElementsTo.style.width = "100%";
    clockifyElements.style.marginLeft = "auto";
    clockifyElements.appendChild(link);
    const clockifyElementsContainer = $(".clockify-elements-container", elem)
    if  (clockifyElementsContainer) {
      clockifyElementsContainer.remove();
    }
    appendElementsTo.appendChild(clockifyElements);
  })
}, 500)

if(window.observeProjectsTimeout)
  clearTimeout(window.observeProjectsTimeout);

window.observeProjectsTimeout = setTimeout(() => observeProjects(), 1000);
