'use strict';

clockifyButton.render(
  '#TaskContainer > .row:not(.clockify), div.taskRow:not(.clockify)',
  { observe: true },
  (elem) => {
    if (elem.querySelectorAll('.clockify').length) {
      return;
    }

    var link,
      newElem,
      landmarkElem,
      newLayout = $('.tc_title', elem),
      taskElem = newLayout || $('.task', elem),
      folderElem = $('.col1', elem) || $('.taskCell:not(.tc_title)', elem),
      folderName = folderElem && folderElem.firstChild.textContent;

    folderName =
      !folderName || folderName === 'No Folder' ? '' : ' - ' + folderName;

      link = clockifyButton.createSmallButton(taskElem.textContent + folderName);

      newElem = document.createElement('div');
      newElem.appendChild(link);
      newElem.setAttribute(
          'style',
          (newLayout ? 'display:inline-block;' : 'float:left;') +
          'width:30px;height:20px;'
      );
      if (!newLayout) {
          link.setAttribute('style', 'top:1px;');
      }

      landmarkElem =
          $('.subm', elem) ||
          $('.subp', elem) ||
          $('.ax', elem) ||
          $('.cellAction', elem) ||
          $('.cellStarSmall', elem);
      landmarkElem.parentElement.insertBefore(newElem, landmarkElem.nextSibling);
  }
);
