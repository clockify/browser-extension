clockifyButton.render('#docs-bars:not(.clockify)', {}, (elem) => {
    var link,
    title = $(".docs-title-input");

    link = clockifyButton.createButton(title ? title.value : "");
    $('.docs-titlebar-buttons').prepend(link);
});
