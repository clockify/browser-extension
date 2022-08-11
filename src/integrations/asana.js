getProject = () => {
    //project = $('.TaskProjects .TokenizerPillBase-name').textContent,
    //let project = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay li.TaskProjectToken.TaskProjects-project');
    let project = $('.TaskPane .TaskProjectToken .TokenizerPillBase-name');
    if (!project) {
        project = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay .TaskProjects .TokenizerPillBase-name');
        if (!project)
            project = $('.SingleTaskPaneSpreadsheet .TaskAncestry-ancestorProjects');
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
    clockifyButton.render('.TaskPane:not(.clockify)',
        {observe: true},
        (elem) => {
            const
                //descriptionSelector = $('.SingleTaskTitleInput-taskName textarea', elem),
                taskSelector = $('.TaskPane-titleRow textarea'),
                // descriptionSelector = $('div.FullWidthPageStructureWithDetailsOverlay-detailsOverlay div.TaskDescription', elem),
                subTask = $('.TaskAncestry-ancestorLink.SecondaryNavigationLink', elem),
                mainTask = taskSelector ? taskSelector.textContent : null,
                taskName = () => {
                    const subTaskName = subTask ? subTask.textContent : null;
                    //return (subTaskName??"") + (!!subTaskName && !!task ? " / " : "") + (task??"")
                    return subTaskName??mainTask
                },
                container = $('.TaskPaneToolbarAnimation-row', elem),
                description = () => mainTask ?? ""// descriptionSelector && !descriptionSelector.textContent.startsWith("Add more detail") //&& !!descriptionSelector.textContent
            //? descriptionSelector.textContent : ""
            ////: taskSelector
            ////    ? taskSelector.textContent :
            ////    "",
            const tags = () => Array.from($$("div.TaskTagTokenPills span.TokenizerPillBase-name", elem)).map(e => e.innerText)
            project = getProject()
            link = clockifyButton.createButton({
                description,
                projectName: project ? project.textContent : null,
                taskName,
                tagNames: tags
            });
            link.style.marginLeft = "10px";
            container.appendChild(link);

            const htmlTagInput = createTag('div', 'button-link');
            const inputForm = clockifyButton.createInput({
                description,
                projectName: project ? project.textContent : null,
                taskName,
                tagNames: tags
            });
            htmlTagInput.append(inputForm);
            container.appendChild(htmlTagInput);
            $('.clockify-input').style.width = "100%";
            $('.clockify-input').style.boxShadow = "none";
            $('.clockify-input').style.border = "1px solid #eaecf0";
            $('.clockify-input').style.marginLeft = "10px";
            $('.clockify-input').style.padding = "0 8px";
            $('.clockify-input').style.fontSize = "12px";
            $('.clockify-input').style.borderRadius = "5px";
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
                tags = () => Array.from($$("div.TaskTagTokenPills span.TokenizerPillBase-name", $('.SingleTaskPaneSpreadsheet'))).map(e => e.innerText),
                description = () => $('.simpleTextarea.AutogrowTextarea-input', elem).textContent.trim(),
                link = clockifyButton.createButton({
                    description,
                    projectName: project ? project.textContent : null,
                    taskName: () => subTaskName ?? maintask, // subTaskName ? subTaskName + " / " + maintask : maintask,
                    tagNames: tags,
                    small: true
                });
            elem.parentNode.appendChild(link);
        }
    );
},100);