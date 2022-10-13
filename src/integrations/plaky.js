removeAllButtons();

clockifyButton.render('.offcanvas-header .walkthrough-board-title > .h4:not(.clockify)', {observe: true}, function (elem) {
    let projectElem = $(".main-wrapper > .sticky-header div[role=textbox]");

    const {project, task} = getProjectTask(projectElem);

    if (elem) {
        elem.style.setProperty('margin-right', '10rem', 'important');
        const description = elem ? elem.textContent : "";
        let inactiveButtonColor = '';
        const theme = document.querySelector('.offcanvas-end');
        if (window.getComputedStyle(theme).backgroundColor.includes('255')) {
            inactiveButtonColor = "#444444";
        } else {
            inactiveButtonColor = "#f2f2f8de";
        }
        const link = clockifyButton.createButton({description, projectName: project, taskName: task, inactiveButtonColor});
        link.style.marginLeft = "15px";
          
        elem.appendChild(link);
    }
});

function getProjectTask(projectElem) {
    var projectName = projectElem ? projectElem.textContent : "";
    var taskName = "";

    if (typeof projectName == "string" && projectName.indexOf(":") > -1) {
        var pNames = projName.split(":");
        projectName = pNames[0];
        taskName = pNames[1];
    }
    return {
        project: projectName,
        task: taskName
    };
}