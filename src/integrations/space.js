clockifyButton.render('div[role=menu]:not(.clockify), .IssueStyles-detailsPanel:not(.clockify)', {observe: true}, function (elem) {
    let description = $('.IssueStyles-header').innerText;
    let project = $('a.XStyles-ellipsis').innerText;

    link = clockifyButton.createButton({
        description: description,
        projectName: project,
        taskName: description,
        tagNames: ["TODO"]
    });
    inputForm = clockifyButton.createInput({
        description: description,
        projectName: project,
        taskName: description,
        tagNames: ["TODO"]
    });

    elem.prepend(link);
    elem.prepend(inputForm);
});
