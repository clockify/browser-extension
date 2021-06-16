clockifyButton.render('.flexible-header:not(.clockify)', {observe: true}, function (elem) {
    let projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left > div > div.ds-editable-component > div > span");
    if (!projectElem) {
        projectElem = $(".current-board-component div.board-name");       
    }

    const project = projectElem ? projectElem.textContent : "";
    const descriptionElem = $(".title-editable", elem);
    
    if (descriptionElem) {
        const description = () => descriptionElem ? descriptionElem.textContent : "";
        link = clockifyButton.createButton(description, project);
        link.style.position = "absolute";
        link.style.top = "5px";
        link.style.right = "5px";
        elem.appendChild(link);
    }
});

clockifyButton.render('.pulse-page-header-component .pulse-page-name-wrapper:not(.clockify)', {observe: true}, function (elem) {
    const descriptionElem = () => $(".ds-text-component > span", elem);
    const description = () => descriptionElem() ? descriptionElem().textContent : "";
    const projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left");
    const project = projectElem ? projectElem.textContent : "";
    link = clockifyButton.createButton(description, project);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.left = "60px";
    elem.appendChild(link);
});

// 
clockifyButton.render('#pulse-card-dialog-component:not(.clockify)', {observe: true}, function (elem) {
    const descriptionElem = () => $(".pulse-card-header .ds-text-component > span", elem);  //
    const description = () => descriptionElem() ? descriptionElem().textContent : "";
    const projectElem = $("#board-header > div.board-header-content-wrapper > div.board-header-main > div.board-header-top > div.board-header-left");
    const project = projectElem ? projectElem.textContent : "";
    link = clockifyButton.createButton(description, project);
    link.style.position = "absolute";
    link.style.top = "5px";
    link.style.left = "60px";
    elem.appendChild(link);
});

