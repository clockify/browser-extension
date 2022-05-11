clockifyButton.render('.issue-details .detail-page-description:not(.clockify)', {observe: true}, (elem) => {
    var link, description,
        numElem = $(".identifier") || $(".breadcrumbs-links li:last-child a"),
        titleElem = $(".title", elem),
        projectElem = $(".title .project-item-select-holder") || $(".breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text"),
        actionsElem = $(".detail-page-header-actions");
    description = titleElem.textContent.trim();
    if (numElem !== null) {
        description = numElem.textContent.split(" ").pop().trim() + " " + description;
    }

    var tags = () => Array.from($$("div.labels .gl-label-text")).map(e => e.innerText);

    link = clockifyButton.createButton({
        description: description,
        projectName: projectElem.textContent.trim(),
        taskName: description,
        tagNames: tags
    });
    link.style.marginRight = '15px';
    link.style.padding = '0px';
    link.style.paddingLeft = '20px';
    actionsElem.parentElement.insertBefore(link, actionsElem);

    var inputForm = clockifyButton.createInput({
        description: description,
        projectName: projectElem.textContent.trim(),
        taskName: description,
        tagNames: tags
    });
    actionsElem.parentElement.insertBefore(inputForm, actionsElem);
});

clockifyButton.render('.merge-request-details.issuable-details > .detail-page-description:not(.clockify)', {observe: true}, (elem) => {
    var link, description,
        numElem = $(".identifier") || $(".breadcrumbs-links li:last-child a"),
        titleElem = $(".title", elem),
        projectElem = $(".title .project-item-select-holder") || $(".breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text"),
        actionsElem = $(".detail-page-header-actions");

    description = titleElem.textContent.trim();

    if (numElem !== null) {
        description = "MR" + numElem.textContent.split(" ").pop().trim().replace("!", "") + "::" + description;
    }

    var tags = Array.from($$("div.labels .gl-label-text")).map(e => e.innerText);


    link = clockifyButton.createButton({
        description: description,
        projectName: projectElem.textContent.trim(),
        taskName: description,
        tagNames: tags
    });
    link.style.marginRight = '15px';
    link.style.padding = '0px';
    link.style.paddingLeft = '20px';
    actionsElem.parentElement.insertBefore(link, actionsElem);

    var inputForm = clockifyButton.createInput({
        description: description,
        projectName: projectElem.textContent.trim(),
        taskName: description,
        tagNames: tags
    });
    actionsElem.parentElement.insertBefore(inputForm, actionsElem);
});
