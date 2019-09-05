
'use strict';

clockifyButton.render('.issue-details .detail-page-description:not(.clockify)', {observe: true}, (elem) => {
    var link, description,
        numElem = $(".identifier") || $(".breadcrumbs-list li:last-child .breadcrumbs-sub-title"),
        titleElem = $(".title", elem),
        projectElem = $(".title .project-item-select-holder") || $(".breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text"),
        actionsElem = $(".detail-page-header-actions");
    description = titleElem.textContent.trim();
    if (numElem !== null) {
        description = numElem.textContent.split(" ").pop().trim() + " " + description;
    }

    link = clockifyButton.createButton(description);
    link.style.marginRight = '15px';
    link.style.padding = '0px';
    link.style.paddingLeft = '20px';
    actionsElem.parentElement.insertBefore(link, actionsElem);
});

clockifyButton.render('.merge-request-details .detail-page-description:not(.clockify)', {observe: true}, (elem) => {
    var link, description,
        numElem = $(".identifier") || $(".breadcrumbs-list li:last-child .breadcrumbs-sub-title"),
        titleElem = $(".title", elem),
        projectElem = $(".title .project-item-select-holder") || $(".breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text"),
        actionsElem = $(".detail-page-header-actions");

    description = titleElem.textContent.trim();

    if (numElem !== null) {
        description = "MR" + numElem.textContent.split(" ").pop().trim().replace("!", "") + "::" + description;
    }

    link = clockifyButton.createButton(description);
    link.style.marginRight = '15px';
    link.style.padding = '0px';
    link.style.paddingLeft = '20px';
    actionsElem.parentElement.insertBefore(link, actionsElem);
});

