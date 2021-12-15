
clockifyButton.render('[aria-label="Edit issue"]:not(.clockify)', {observe: true}, function (elem) {
    // We'll extract the data via the path since Linear app uses an excessive minification strategy.
    const pathArray = window.location.pathname.split('/');
    issueId = pathArray[3];
    description = document.title;
    // Normalize the project id.
    project = pathArray[1].replace(/-/g, ' ').toLowerCase().replace(/(^|\s)\S/g, L => L.toUpperCase());
    
    link = clockifyButton.createButton({
        description: description,
        projectName: project,
        taskName: description,
    });
  
    link.style.padding = "0 14px";
    elem.parentNode.prepend(link);
});
