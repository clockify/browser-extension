'use strict';
clockifyButton.render('.window-header:not(.clockify)', {observe: true}, (elem) => {
    let link, container = createTag('div', 'button-link trello-tb-wrapper'),
        desc, project,
        titleElem = $('.window-title h2', elem),
        projectElem = $('.board-header-btn-name > span'),
        descriptionElem = $('.js-move-card');
    if (!descriptionElem) {
        return;
    }

    desc = titleElem.textContent;

    project = projectElem.textContent.trim();

    link = clockifyButton.createButton(desc, project);
    container.appendChild(link);
    descriptionElem.parentNode.insertBefore(container, descriptionElem);
}, ".window-wrapper");

/* Checklist buttons */
clockifyButton.render('.checklist-item-details:not(.clockify)', {observe: true}, (elem) => {
    let link,
        projectElem = $('.board-header-btn-name > span'),
        titleElem = $('.window-title h2'),
        taskElem = $('.checklist-item-details-text', elem);

    link = clockifyButton.createSmallButton(
        titleElem.textContent + " - " + taskElem.textContent,
        projectElem.textContent.trim()
        );
    link.classList.add('checklist-item-button');
    link.style.position = 'absolute';
    link.style.paddingTop = 0;
    link.style.right = 0;
    link.style.top = 0;
    elem.parentNode.appendChild(link);
}, ".checklist-items-list, .window-wrapper");
