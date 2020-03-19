clockifyButton.render('.taskItem-titleWrapper:not(.clockify)', {observe: true}, function (elem) {
    var link, container = createTag('a', 'taskItem-clockify'),
        listElem = $('.lists-scroll'),
        titleElem = $('.taskItem-titleWrapper-title', elem),
        projectElem = $('.active', listElem),
        projectTitleElem = $('.title', projectElem);

    link = clockifyButton.createSmallButton( titleElem.textContent);

    container.appendChild(link);
    elem.insertBefore(container, titleElem);


});

/* Checklist buttons */
clockifyButton.render('.subtask:not(.clockify)', {observe: true}, function (elem) {
    var link, container = createTag('span', 'detailItem-clockify small'),
        listElem = $('.lists-scroll'),
        chkBxElem = $('.checkBox', elem),
        titleElem = $('.title-container'),
        projectElem = $('.active', listElem),
        projectTitleElem = $('.title', projectElem),
        taskElem = $('.display-view', elem);

    link = clockifyButton.createSmallButton(titleElem.textContent + ' - ' + taskElem.textContent);

    container.appendChild(link);
    chkBxElem.parentNode.insertBefore(container, chkBxElem);
});