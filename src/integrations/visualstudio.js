// Individual Work Item & Backlog page
clockifyButton.render('.witform-layout-content-container:not(.clockify)', {observe: true}, function () {
    var link,
        description = $('.work-item-form-id span').innerText + ' ' + $('.work-item-form-title input').value,
        container = $('.work-item-form-header-controls-container'),

    link = clockifyButton.createButton(description);
        link.style.float = 'right';
        link.style.marginTop = '-15px';
        container.appendChild(link);
});