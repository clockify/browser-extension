// Render in side-bar of card Modal
clockifyButton.render('.eve-accordions:not(.clockify)', {observe: true}, function (elem) {
    cardId = $("span.card-id").innerText;
    description = cardId + " " + $("span.card-title").innerText;

    function findProjectNameInCustomFields(customFields) {
        for (let field of customFields) {
            if (field.querySelector(".eve-form-label").innerText === "Clockify Project") {
                projectName = field.querySelector("input.eve-input.js-value").value;
            }
        }
        return projectName
    }

    // Allow defining Clockify Project Name in Custom Field.
    // Use card name as sensible default if undefined.
    customFields = document.querySelectorAll("div.card-custom-field");
    projectName = findProjectNameInCustomFields(customFields) || '';

    button = clockifyButton.createButton({
        description: description,
        projectName: projectName,
        taskName: description,
        tagNames: []
    });
    button.className = "eve-cell";
    input = clockifyButton.createInput({
        description: description,
        projectName: projectName,
        taskName: description,
        tagNames: []
    });
    input.className = "eve-cell";
    wrapperDiv = createTag("div");
    wrapperDiv.className = "eve-grid";
    wrapperDiv.style.marginBottom = "10px";
    wrapperDiv.appendChild(input);
    wrapperDiv.appendChild(button);
    elem.parentNode.insertBefore(wrapperDiv, elem);
})