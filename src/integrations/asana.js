// New task pane list detail modal
setTimeout(() => {
    clockifyButton.render('.SingleTaskPaneSpreadsheet:not(.clockify)', {observe: true}, (elem) => {
        var link,
            container = $('.SingleTaskPaneToolbarAnimation-row', elem),
            description = $('.SingleTaskTitleInput-taskName textarea', elem) ?
                $('.SingleTaskTitleInput-taskName textarea', elem).textContent : "",
            project = $('.TaskProjects .TokenizerPillBase-name').textContent;
            link = clockifyButton.createButton({
            description: description,
            projectName: project,
            taskName: description
        });
        link.style.marginLeft = "10px";
        container.appendChild(link);

    });
},500);

// subtasks
setTimeout(() => {
  clockifyButton.render('.ItemRowTwoColumnStructure-left:not(.clockify)', {observe: true}, (elem) => {
      maintask = $('.SingleTaskTitleInput-taskName textarea') ?  $('.SingleTaskTitleInput-taskName textarea').textContent : "", 
     project = $('.TaskProjects .TokenizerPillBase-name').textContent;
      let description = $('.simpleTextarea.AutogrowTextarea-input', elem).textContent.trim();
      link = clockifyButton.createButton({
          description: description,
          projectName: project,
          taskName: maintask,
          small: true
      });
      elem.parentNode.appendChild(link);
  });
},100);