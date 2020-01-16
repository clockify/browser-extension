clockifyButton.render('.info-text-wrapper:not(.clockify)', {observe: true}, function (elem) {
        workItemId = document.title;
        project = $(".navigation-container .project-item .text-ellipsis").textContent;
        workItemId = workItemId.substring(0, workItemId.length-9);
        link = clockifyButton.createButton(workItemId, project);
        link.style.display = "block";
        link.style.paddingTop = "0";
        link.style.paddingBottom = "0";
        link.style.marginLeft = "10px";
        link.style.cursor = 'pointer';

        elem.appendChild(link);
});

