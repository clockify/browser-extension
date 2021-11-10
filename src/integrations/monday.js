var style = document.createElement('style');
style.innerHTML = `
  #divClockifyPopupDlg.clockify-popup-dlg{
    z-index: 100000000;
  }
#divClockifyTagDropDownPopup{
    z-index: 100000000;
  }
#divClockifyProjectDropDownPopup{
    z-index: 100000000;
}
  `;
document.head.appendChild(style);

// Pulse from standard board
clockifyButton.render('.flexible-header:not(.clockify)', { observe: true }, function (elem) {
    let projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left > div > div.ds-editable-component > div > span");
    if (!projectElem) {
        projectElem = $(".current-board-component div.board-name");       
    }

    var projectRefs = GetProjectAndTask(projectElem);
    const descriptionElem = $(".title-editable", elem);
    
    if (descriptionElem) {
        const description = () => descriptionElem ? descriptionElem.textContent : "";
        link = clockifyButton.createButton(description, projectRefs.project, projectRefs.task);
        link.style.position = "absolute";
        link.style.top = "5px";
        link.style.right = "5px";
        elem.appendChild(link);
    }
});

// Pulse from "my word" board
clockifyButton.render('.pulse-page-header-component .pulse-page-name-wrapper:not(.clockify)', { observe: true }, function (elem) {
    const descriptionElem = () => $(".ds-text-component > span", elem);
    const description = () => descriptionElem() ? descriptionElem().textContent : "";
    const projectElem = $("div.pulse-page-header-component > div.link-to-pulse > .open-pulse-in-board-link");
    var projectRefs = GetProjectAndTask(projectElem);
    link = clockifyButton.createButton(description, projectRefs.project, projectRefs.task);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.left = "60px";
    elem.appendChild(link);
});

// Pulse from kanban board
clockifyButton.render('#pulse-card-dialog-component:not(.clockify)', { observe: true }, function (elem) {
    const descriptionElem = () => $(".pulse-card-header .ds-text-component > span", elem);  //
    const description = () => descriptionElem() ? descriptionElem().textContent : "";
    const projectElem = $("#pulse-card-dialog-scrollable-wrapper > div.pulse-card-header > div.pulse-data > div.link-to-pulse > .open-pulse-in-board-link");
    var projectRefs = GetProjectAndTask(projectElem);
    link = clockifyButton.createButton(description, projectRefs.project, projectRefs.task);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.left = "60px";
    elem.appendChild(link);
});

function GetProjectAndTask(projectElem) {
    var projName = projectElem ? projectElem.textContent : "";
    var taskName = "";

    if (typeof projName == "string" && projName.indexOf(":") > -1) {
        var pNames = projName.split(":");
        projName = pNames[0];
        taskName = pNames[1];
    }
    return { project: projName, task: taskName };
}