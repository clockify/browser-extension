//Render clockify button in Tasks page
clockifyButton.render('div.tasks-container_section._task div.task-options:not(.clockify)', {observe: true}, function (elem) {
    var link;
    var taskName = document.querySelector("textarea[name='title']").innerHTML || false;
    var taskID = document.querySelector("div.tasks-container_section._task div.id-indicator").innerText || false;
    if (!taskName || !taskID) {
        return;
    }
    link = clockifyButton.createSmallButton(taskName + " #" + taskID);
    link.style.marginLeft = '7px';
    link.style.background = '#f8f8fc';
    link.style.padding = '5px';
    link.style.borderRadius = '5px';
    elem.appendChild(link);
});