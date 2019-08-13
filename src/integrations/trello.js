setTimeout(() => {
    'use strict';
    clockifyButton.render('.window-sidebar:not(.clockify)', {observe: true}, (elem) => {
        const root = $('div[id="trello-root"]');
        const container = elem.lastChild.childNodes[1];
        const htmlTag = createTag('div', 'button-link');
        const projectElem = $('.board-header-btn-text', root).textContent.trim();
        const desc = $('div[class="window-title"] > h2', root).textContent.trim();

        const link = clockifyButton.createButton(desc, projectElem);
        htmlTag.appendChild(link);
        container.prepend(htmlTag);
    });

    /* Checklist buttons */
    clockifyButton.render('.checklist-item-details:not(.clockify)', {observe: true}, (elem) => {
        const root = $('div[id="trello-root"]');
        const project= $('.board-header-btn > span').textContent.trim();
        const desc = $('div[class="window-title"] > h2', root).textContent;
        const task = $('.checklist-item-details-text', elem).textContent;

        const link = clockifyButton.createSmallButton(
            desc + " - " + task,
            project
        );
        link.classList.add('checklist-item-button');
        link.style.position = 'absolute';
        link.style.paddingTop = 0;
        link.style.paddingRight = 0;
        link.style.right = '30px';
        link.style.top = '6px';
        elem.appendChild(link);
    });
}, 1000);
