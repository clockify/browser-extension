setTimeout(() => {
    clockifyButton.render('.ms-Dialog-main:not(.clockify)', { observe: true }, (elem) => {
        console.log(elem);
        const root = $("#planner-main-content");
        const container = $(".ms-Dialog-topButton", elem);

        var link, 
                title = $(".topHeader .nonIcon .primaryTextSection h2", root).textContent, 
                taskName = $(".ms-TextField input", elem).value;

        link = clockifyButton.createButton(taskName, title);
        link.classList.add("ms-Button");
        container.prepend(link);
    });

    clockifyButton.render('.checklistItem:not(.clockify)', { observe: true }, (elem) => {
        const root = $("#planner-main-content");
        const container = $(".checklistItemCommands", elem);

        var link, 
                projectName = $(".topHeader .nonIcon .primaryTextSection h2", root).textContent, 
                boardName = $(".ms-Dialog-main .ms-TextField input").value,
                taskName = $(".checklistItemTitle ", elem).textContent;

        link = clockifyButton.createSmallButton(`${boardName} - ${taskName}`, projectName);
        link.style.padding = "8px";
        link.classList.add("ms-Icon");

        container.appendChild(link);
    });
}, 3000)