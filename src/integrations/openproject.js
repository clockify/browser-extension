// Work packages list items
clockifyButton.render('table.work-package-table tbody tr td.id:not(.clockify)', {observe: true}, (elem) => {
    var link,
        container = elem,
        description = $('span[data-field-name="subject"]', elem.parentNode).textContent.trim(),
        projectName = $('#projects-menu').title.trim();

    link = clockifyButton.createSmallButton(description);

    container.appendChild(link);
});

// Work packages details view
clockifyButton.render('.work-packages--show-view:not(.clockify)', {observe: true}, (elem) => {
    var link,
        container = $('.attributes-group--header', elem),
        description = $('.subject').textContent.trim(),
        projectName = $('#projects-menu').title.trim();

    link = clockifyButton.createButton(description);

    container.insertBefore(link, container.firstChild);
});
