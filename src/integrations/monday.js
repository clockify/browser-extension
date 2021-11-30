

// Pulse from standard board
clockifyButton.render('.flexible-header:not(.clockify)', {observe: true}, function (elem) {
    const projectElem = () => { 
        let projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left > div > div.ds-editable-component > div > span");
        if (!projectElem) {
            projectElem = $(".current-board-component div.board-name");       
        }
        if (!projectElem) {
            projectElem = $(".pulse-page-header-component a.open-pulse-in-board-link");
        }
        return projectElem;
    }
    const project = () => { return getProject(projectElem()) }
    const task = () => { return getTask(projectElem()) }

    const descriptionElem = $(".title-editable", elem);
    
    if (descriptionElem) {
        const description = () => descriptionElem ? descriptionElem.textContent : "";
        link = clockifyButton.createButton(description, project, task);
        link.style.position = "absolute";
        link.style.top = "5px";
        link.style.right = "5px";
        elem.appendChild(link);
    }
});


// Pulse from "my word" board
clockifyButton.render('.pulse-page-header-component .pulse-page-name-wrapper:not(.clockify)', {observe: true}, function (elem) {
    const descriptionElem = () => $(".ds-text-component > span", elem);
    const description = () => descriptionElem() ? descriptionElem().textContent : "";
    const projectElem = () => { 
        let projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left");
        if (!projectElem) {
            projectElem = $(".pulse-page-header-component a.open-pulse-in-board-link");   
        }        
        return projectElem;
    }
    const project = () => { return getProject(projectElem()) }
    const task = () => { return getTask(projectElem()) }
    link = clockifyButton.createButton(description, project, task);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.left = "60px";
    elem.appendChild(link);
});

// Pulse from kanban board 
clockifyButton.render('#pulse-card-dialog-component:not(.clockify)', {observe: true}, function (elem) {
    const descriptionElem = () => $(".pulse-card-header .ds-text-component > span", elem);  //
    const description = () => descriptionElem() ? descriptionElem().textContent : "";
    const projectElem = () => {
        let projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left");
        if (!projectElem) {
            projectElem = $(".pulse-card-dialog-component a.open-pulse-in-board-link");
        }
        return projectElem;
    }
    const project = () => { return getProject(projectElem()) }
    const task = () => { return getTask(projectElem()) }

    link = clockifyButton.createButton(description, project, task);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.left = "60px";
    elem.appendChild(link);
});

// for this version we used dynamic project, because of modal dlgs (chat/timeline views)
function getProject(projectElem) {
    var projName = projectElem ? projectElem.textContent : "";
    var taskName = "";

    if (typeof projName == "string" && projName.indexOf(":") > -1) {
        var pNames = projName.split(":");
        projName = pNames[0];
        taskName = pNames[1];
    }
    return projName;
}

function getTask(projectElem) {
    var projName = projectElem ? projectElem.textContent : "";
    var taskName = "";
    if (typeof projName == "string" && projName.indexOf(":") > -1) {
        var pNames = projName.split(":");
        projName = pNames[0];
        taskName = pNames[1];
    }
    return taskName;
}

