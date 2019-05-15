clockifyButton.render('.wrike-panel-header:not(.clockify)', {observe: true}, function (elem) {
    var link,
        container = $('.wrike-panel-header-toolbar', elem),
        titleElem = function () {
            return $('.title-field-ghost').textContent;
        };
    link = clockifyButton.createButton(titleElem);

    container.insertBefore(link, container.firstChild);
});
