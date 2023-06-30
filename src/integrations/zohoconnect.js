clockifyButton.render('.zc-taskInformation:not(.clockify)', {observe: true}, function (elem) {
    const taskName = $(".zc-popupTaskTitle").innerText;
    const boardName = $(".zc-taskProjectInfo").innerText;

    const link = clockifyButton.createButton({
        description: taskName,
        projectName: boardName,
        small: false
    });
    link.style.paddingBottom = "25px";
    elem.prepend(link);

});
