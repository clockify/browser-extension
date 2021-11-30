
getProject = () =>  {
    //project = $('.TaskProjects .TokenizerPillBase-name').textContent,
    //let project = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay li.TaskProjectToken.TaskProjects-project');
    let project = $('div.SingleTaskPaneSpreadsheet .TaskProjects .TokenizerPillBase-name');
    if (!project) { 
        project = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskProjects .TokenizerPillBase-name');
        if (!project)
            project = $('div.SingleTaskPaneSpreadsheet .TaskAncestry-ancestorProjects');
        if (!project)
            // project = $('h1.TopbarPageHeaderStructure-title')
            project = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskAncestry-ancestorProjects');
        if (!project)
            project = $('div.Pane.Inbox-pane.Inbox-detailsPane .TokenizerPillBase-name');
    }
    return project;
}

// New task pane list detail modal
setTimeout(() => {
    clockifyButton.render('.SingleTaskPaneSpreadsheet:not(.clockify)',
        {observe: true}, 
        (elem) => {
            const 
                //descriptionSelector = $('.SingleTaskTitleInput-taskName textarea', elem),
                taskSelector = $('.SingleTaskPaneSpreadsheet-titleRow textarea'),
                // descriptionSelector = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay div.TaskDescription', elem),
                subTask = $('.TaskAncestry-ancestorLink.SecondaryNavigationLink', elem),
                mainTask = taskSelector ? taskSelector.textContent : null,
                taskName = () => {
                    const subTaskName = subTask ? subTask.textContent : null;
                    //return (subTaskName??"") + (!!subTaskName && !!task ? " / " : "") + (task??"")
                    return subTaskName??mainTask
                },
                container = $('.SingleTaskPaneToolbarAnimation-row', elem),
                description = () => mainTask??""// descriptionSelector && !descriptionSelector.textContent.startsWith("Add more detail") //&& !!descriptionSelector.textContent
                    //? descriptionSelector.textContent : ""
                    ////: taskSelector 
                    ////    ? taskSelector.textContent :
                    ////    "",
                project = getProject()
                link = clockifyButton.createButton({
                    description,
                    projectName: project ? project.textContent : null,
                    taskName 
                });
            link.style.marginLeft = "10px";
            container.appendChild(link);
        }
    );
},500);


// subtasks
setTimeout(() => {
    clockifyButton.render('.ItemRowTwoColumnStructure-left:not(.clockify)',
        {observe: true},
        (elem) => {
            const
                //maintaskSelector = $('.SingleTaskTitleInput-taskName textarea'),
                maintaskSelector = $('.SingleTaskPaneSpreadsheet-titleRowInput textarea'),
                parentElem = $('div.ShadowScrollable-body.SingleTaskPaneSpreadsheet-body'),
                subTask = $('.TaskAncestry-ancestorLink.SecondaryNavigationLink', parentElem),
                subTaskName = subTask ? subTask.textContent : null,
                maintask = maintaskSelector ? maintaskSelector.textContent : "",
                project = getProject(),
                description = () => $('.simpleTextarea.AutogrowTextarea-input', elem).textContent.trim(),
                link = clockifyButton.createButton({
                    description,
                    projectName: project ? project.textContent : null,
                    taskName: () => subTaskName ?? maintask, // subTaskName ? subTaskName + " / " + maintask : maintask,
                    small: true
                });
            elem.parentNode.appendChild(link);
        }
    );
},100);