
/* Epic/User story/Task/Issue details button */
clockifyButton.render('.detail-title-wrapper:not(.clockify)', {observe: true}, (elem) => {
    var link,
        input,
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        refElem = $('.detail-ref', elem),
        titleElem = $('.detail-subject', elem);
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
    link = clockifyButton.createButton({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
            small: true
        });
    input = clockifyButton.createInput({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
        });
    link.style.marginRight = ".4em"
    input.style.marginRight = ".4em"
    input.style.fontSize = "small"
    // elem.insertbefore(link, $('.detail-title-text', elem));
    elem.append(link);
    elem.insertBefore(input, link)
});

/* Epics Dashboard */
clockifyButton.render('.epic-row .name:not(.clockify)', {observe: true}, (elem) => {

    var link,
        refElem = $('a > span:nth-child(1)', elem),
        titleElem = $('a > span:nth-child(2)', elem),
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
    link = clockifyButton.createButton({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
            small: true
        });
    link.style.marginRight = ".2em"
    elem.insertBefore(link, $('a', elem));
});

/* Backlog buttons */

clockifyButton.render('.user-story-main-data:not(.clockify)', {observe: true}, (elem) => {

    var link,
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        refElem = $('a > span:nth-child(1)', elem),
        titleElem = $('a > span:nth-child(2)', elem),
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;

    link = clockifyButton.createButton({
        description: taskName,
        projectName: projectElem.textContent.trim(),
        taskName: taskName,
        small: true
    });

elem.insertBefore(link, $('a', elem));
});

/* Kanban buttons */
clockifyButton.render('.kanban .card-title:not(.clockify)', {observe: true}, (elem) => {
    var link,
        refElem = $('a > span:nth-child(1)', elem),
        titleElem = $('a > span:nth-child(2)', elem),
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;


    link = clockifyButton.createButton({
        description: taskName,
        projectName: projectElem.textContent.trim(),
        taskName: taskName,
        small: true
    });
    link.style.flexGrow = 0;
    /*change display from flex to inline-flex to put the button inline with the task link*/
    link.style.display = "inline-flex"
    $('a', elem).style.display = "inline-flex"
    link.style.marginRight = ".2em"
    elem.insertBefore(link, $('a', elem));
});

/* Sprint Taskboard tasks buttons */
clockifyButton.render('.taskboard .card-title:not(.clockify)', {observe: true}, (elem) => {

    var link,
        input,
        refElem = $('.card-title > a > span:nth-child(1)', elem),
        titleElem = $('.card-title > a > span:nth-child(2)', elem),
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
    
    
    link = clockifyButton.createButton({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
            small: true
        });
    input = clockifyButton.createInput({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
        });
    link.style.flexGrow = 0;

    link.style.display = "inline"
    link.style.marginRight = ".2em"
    input.style.display = "inline"
    input.style.marginRight = ".2em"
    input.style.height = "25px"
    input.style.fontSize = "small"
    elem.insertBefore(link, $('a', elem));
    elem.insertBefore(input, link)
});


/* Issues list buttons */
clockifyButton.render('.row:not(.title) > div.subject:not(.clockify)', {observe: true}, (elem) => {
    var link,
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        refElem = $('.issue-text > span:nth-child(1)', elem),
        titleElem = $('.issue-text > span:nth-child(2)', elem),
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
    link = clockifyButton.createButton({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
            small: true
        });
    /*change display from flex to inline-flex to put the button inline with the task link*/
    link.style.display = "inline-flex"
    $('a', elem).style.display = "inline-flex"
    link.style.marginRight = ".2em"
    elem.prepend(link);
});

/* Task list in User story details buttons */
clockifyButton.render('.related-tasks-body > .single-related-task > .task-name:not(.clockify)', {observe: true}, (elem) => {
    var link,
        projectElem = $('div.sticky-project-menu > tg-legacy-loader').shadowRoot.querySelector('span.project-name'),
        refElem = $('a > span:nth-child(1)', elem),
        titleElem = $('a > span:nth-child(2)', elem),
        taskName = refElem.textContent.trim() + ' ' + titleElem.textContent;
        link = clockifyButton.createButton({
            description: taskName,
            projectName: projectElem.textContent.trim(),
            taskName: taskName,
            small: true
        });
        link.style.marginRight = ".2em"
    elem.insertBefore(link,$('a', elem));
});