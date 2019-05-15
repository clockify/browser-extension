'use strict';

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

clockifyButton.render(
  '#gqItemList .gq-item-row:not(.clockify)',
  { observe: true },
  (elem) => {
    var link,
      container = createTag('div', 'taskItem-clockify'),
      titleElem = $('.gq-i-description', elem),
      projectContainer = $('.gq-queue-container.selected .gq-queue-name');

    if (titleElem) {
        link = clockifyButton.createSmallButton(titleElem.textContent);

        container.appendChild(link);
        container.style.paddingTop = '5px'; // move button 5px down
        insertAfter(container, titleElem);
    }
  }
);
