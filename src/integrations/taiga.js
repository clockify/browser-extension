/* Epic/User story/Task/Issue details button */
clockifyButton.render('.detail-title-wrapper:not(.clockify)', {observe: true}, (elem) => {
    var link,
        projectElem = $('.us-detail .project-name'),
        refElem = $('.detail-number', elem),
        titleElem = $('.detail-subject', elem);
    link = clockifyButton.createSmallButton(refElem.textContent.trim() + ' ' + titleElem.textContent);

    elem.insertBefore(link, $('.detail-title-text', elem));
});

/* Epics Dashboard */
clockifyButton.render('.epic-row .name:not(.clockify)', {observe: true}, (elem) => {

    var link,
        titleElem = $('a', elem),
        projectElem = $('.epics .project-name');
    link = clockifyButton.createSmallButton(titleElem.textContent);
    elem.insertBefore(link, $('a', elem));
});

/* Backlog buttons */
clockifyButton.render('.user-story-name:not(.clockify)', {observe: true}, (elem) => {

    var link,
        projectElem = $('.backlog .project-name'),
        refElem = $('a > span:nth-child(1)', elem),
        taskElem = $('a > span:nth-child(2)', elem);
    link = clockifyButton.createSmallButton(refElem.textContent.trim() + ' ' + taskElem.textContent);

    elem.insertBefore(link, $('a', elem));
});

/* Kanban buttons */
clockifyButton.render('.kanban .card-title:not(.clockify)', {observe: true}, (elem) => {
    var link,
        refElem = $('a > span:nth-child(1)', elem),
        titleElem = $('a > span:nth-child(2)', elem),
        projectElem = $('.kanban .project-name');

    link = clockifyButton.createSmallButton(refElem.textContent + ' ' + titleElem.textContent);
    link.style.flexGrow = 0;

    elem.insertBefore(link, $('a', elem));
});

/* Sprint Taskboard tasks buttons */
clockifyButton.render('.taskboard .card-title:not(.clockify)', {observe: true}, (elem) => {

    var link,
        refElem = $('.card-title > a > span:nth-child(1)', elem),
        titleElem = $('.card-title > a > span:nth-child(2)', elem),
        projectElem = $('.taskboard .project-name-short');
    link = clockifyButton.createSmallButton(refElem.textContent.trim() + ' ' + titleElem.textContent);
    link.style.flexGrow = 0;
    elem.insertBefore(link, $('a', elem));
});


/* Issues list buttons */
clockifyButton.render('.issues-table .row:not(.clockify)', {observe: true}, (elem) => {
    var link,
        projectElem = $('.issues-page .project-name'),
        refElem = $('a > span:nth-child(1)', elem),
        taskElem = $('a > span:nth-child(2)', elem);
    link = clockifyButton.createSmallButton(refElem.textContent.trim() + ' ' + taskElem.textContent);
    link.style.flexGrow = 0;
    elem.insertBefore(link, $('.subject', elem));
});
