clockifyButton.render(
  '.wspace-task-view:not(.clockify)',
  { observe: true },
  function (elem) {
    const container = $('.wrike-panel-header-toolbar', elem);

    const getTitleElement = function () {
      const wsTaskTitle = document.querySelectorAll('ws-task-title');
      if (wsTaskTitle.length === 1 && wsTaskTitle[0].textContent !== '') {
        return wsTaskTitle[0];
      }
      return $('title');
    };

    const descriptionText = function () {
      const urlString = window.location.href;
      const url = new URL(urlString);
      const hash = url.hash.substr(1);
      const hashParts = hash.split('&');
      let taskId = null;
      for (let i = 0; i < hashParts.length; i++) {
        const partSplit = hashParts[i].split('=');
        if (partSplit[0] === 'ot') {
          taskId = partSplit[1];
        }
      }

      const titleElem = getTitleElement();
      const titleElemText = titleElem ? titleElem.textContent : 'not found';
      return `${taskId ? '#' + taskId : ''} ${titleElemText.trim().replace(' - Wrike', '')}`.trim();
    };

    const link = clockifyButton.createButton(descriptionText);

    container.insertBefore(link, container.firstChild);
  }
);
