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
  //remove existing buttons before creating new ones
  const clockifyButtonElement = $("#clockifyButton");
  const clockifyInputElement = $(".clockify-input-container");
  if (clockifyButtonElement) clockifyButtonElement.remove();
  if(clockifyInputElement) clockifyInputElement.remove();

  const taskSelector = $(".TaskPane-titleRow textarea"),
        subTask = $(".TaskAncestry-ancestorLink.SecondaryNavigationLink", containerElem),
        mainTask = taskSelector ? taskSelector.textContent : null,
        taskName = () => {
          const subTaskName = subTask ? subTask.textContent : null;
          return subTaskName ?? mainTask;
        },
        container = $(".TaskPaneToolbarAnimation-row", containerElem),
        description = () => mainTask ?? "";
      const tags = () =>
        Array.from(
          $$("ul.TaskTagTokenPills span.TokenizerPillBase-name", containerElem)
        ).map((e) => e.innerText);
      project = getProject();
      link = clockifyButton.createButton({
        description,
        projectName: project ? project.textContent : null,
        taskName,
        tagNames: tags,
      });
      link.style.marginLeft = "10px";
      container.appendChild(link);

      const htmlTagInput = createTag("div", "clockify-input-container");
      const inputForm = clockifyButton.createInput({
        description,
        projectName: project ? project.textContent : null,
        taskName,
        tagNames: tags,
      });
      htmlTagInput.append(inputForm);
      container.appendChild(htmlTagInput);
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
  clockifyButton.render(
    ".TaskPane:not(.clockify)",
    { observe: true },
    (elem) => {
      const //maintaskSelector = $('.SingleTaskTitleInput-taskName textarea'),
        maintaskSelector = $(
          ".TaskPane-titleRow textarea"
        ),
        parentElem = $(
          "div.ShadowScrollable-body.TaskPane-body"
        ),
        subTask = $(
          ".TaskAncestry-ancestorLink.SecondaryNavigationLink",
          parentElem
        ),
        subTaskName = subTask ? subTask.textContent : null,
        maintask = maintaskSelector ? maintaskSelector.textContent : "",
        project = getProject(),
        tags = () =>
          Array.from(
            $$(
              "div.TaskTagTokenPills span.TokenizerPillBase-name",
              $(".TaskPane")
            )
          ).map((e) => e.innerText),
        description = () =>
          $(".simpleTextarea.AutogrowTextarea-input", elem).textContent.trim(),
        link = clockifyButton.createButton({
          description,
          projectName: project ? project.textContent : null,
          taskName: () => subTaskName ?? maintask, // subTaskName ? subTaskName + " / " + maintask : maintask,
          tagNames: tags,
          small: true,
        });
      elem.parentNode.appendChild(link);
    }
  );
}, 500);

if(window.observeProjectsTimeout)
  clearTimeout(window.observeProjectsTimeout);

window.observeProjectsTimeout = setTimeout(() => observeProjects(), 1000);
