removeAllButtons();

clockifyButton.render('.offcanvas-header > div > .offcanvas-title:not(.clockify)', {observe: true}, function (elem) {
    let projectElem = $(".main-wrapper > .sticky-header div[role=textbox]");

    const {project, task} = getProjectTask(projectElem);

    if (elem) {
        elem.style.setProperty('margin-right', '10rem', 'important');
        const description = elem ? elem.textContent : "";
        const link = clockifyButton.createButton(description, project, task);
        link.style.position = "absolute";
        link.style.right = "55px";
        const theme = document.querySelector('.offcanvas-end');
          if (window.getComputedStyle(theme).backgroundColor.includes('255')) {
            link.style.color = "#444444";
        } else {
            link.style.color = "#f2f2f8de";
        }
        document.getElementsByClassName('icon-sun')[0].parentNode.addEventListener('click', () => {
            link.style.color = "#444444";
        });
            
        document.getElementsByClassName('icon-moon')[0].parentNode.addEventListener('click', () => {
            link.style.color = "#f2f2f8de";
        });
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