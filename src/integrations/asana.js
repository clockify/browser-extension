    setTimeout(() => {
    clockifyButton.render('.SingleTaskPane:not(.clockify)', {observe: true}, (elem) => {
        var link,
            container = $('.SingleTaskPaneToolbar-leftItems', elem),
            description = $('.SingleTaskPane-titleRowInput > div > textarea', elem) ?
                $('.SingleTaskPane-titleRowInput > div > textarea', elem).textContent : "",
            projectElements = document.getElementsByClassName('PotTokenizerPillBase-name'),
            project = projectElements && projectElements.length > 0 ?
                projectElements[0].textContent : "";
        link = clockifyButton.createButton({
            description: description,
            projectName: project,
            taskName: description,
            tagNames: tags
        });
        link.style.marginLeft = "10px";
        container.appendChild(link);

    });
}, 1000);

// New task pane list detail modal
setTimeout(() => {
    clockifyButton.render('.SingleTaskPaneSpreadsheet:not(.clockify)', {observe: true}, (elem) => {
        var link,
          tags = () => Array.from($$(".TaskTags-labeledRowStructure .PotTokenizerPillBase-name")).map(e => e.innerText),
            container = $('.SingleTaskPaneToolbarAnimation-row', elem),
            description = $('.SingleTaskTitleInput-taskName textarea', elem) ?
                $('.SingleTaskTitleInput-taskName textarea', elem).textContent : "",
            projectElements = document.getElementsByClassName('PotTokenizerPillBase-name'),
            project = projectElements && projectElements.length > 0 ?
                projectElements[0].textContent : "";
        link = clockifyButton.createButton({
            description: description,
            projectName: project,
            taskName: description,
            tagNames: tags
        });
        link.style.marginLeft = "10px";
        container.appendChild(link);

    });
},100);

// subtasks
setTimeout(() => {
  clockifyButton.render('.ItemRowTwoColumnStructure-left:not(.clockify)', {observe: true}, (elem) => {
      projectElements = document.getElementsByClassName('PotTokenizerPillBase-name'),
      tags = () => Array.from($$(".TaskTags-labeledRowStructure .PotTokenizerPillBase-name")).map(e => e.innerText),
      maintask = $('.SingleTaskTitleInput-taskName textarea') ?  $('.SingleTaskTitleInput-taskName textarea').textContent : "", 
      project = projectElements && projectElements.length > 0 ?
                projectElements[0].textContent : "";
      let description = $('.simpleTextarea.AutogrowTextarea-input', elem).textContent.trim();
      link = clockifyButton.createButton({
          description: description,
          projectName: project,
          taskName: maintask,
          tagNames: tags,
          small: true
      });
      elem.parentNode.appendChild(link);
  });
},100);