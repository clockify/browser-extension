clockifyButton.render('#widget99:not(.clockify)', {observe: true}, function (elem) {
    const descriptionElement = document.getElementById('clockify-task-name');
    const description = descriptionElement !== null ? descriptionElement.innerText : 'Cerb';

    const projectElement = document.getElementById('clockify-project-name');
    const projectName = projectElement !== null ? projectElement.innerText : '';

    const link = clockifyButton.createButton(description, projectName);
    elem.appendChild(link);
});