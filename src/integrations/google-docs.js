clockifyButton.render('#docs-bars:not(.clockify)', {}, (elem) => {
    var link, inputForm,
    title = $(".docs-title-input");

    inputForm = clockifyButton.createInput({
        description: title ? title.value : "",
    });

    link = clockifyButton.createButton(title ? title.value : "");
    inputForm.style.marginRight = "15px";
    $('.docs-titlebar-buttons').prepend(link);
    $('.docs-titlebar-buttons').prepend(inputForm);
});
