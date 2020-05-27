setTimeout(() => {
        clockifyButton.render('.window-sidebar:not(.clockify)', {observe: true}, (elem) => {
        const root = $('div[id="trello-root"]');
        const container = elem.lastChild.childNodes[1];
        const htmlTag = createTag('div', 'button-link');
        const htmlTagInput = createTag('div', 'button-link');
        const projectElem = $('.board-header-btn-text', root).textContent.trim();
        const desc = $('div[class="window-title"] > h2', root).textContent.trim();
        const cardId = "[" + document.URL.substr(21,8) + "] ";
        htmlTagInput.style.padding = "0px";

        const inputForm = clockifyButton.createInput({
            description: cardId + desc,
            projectName: projectElem
        });
        htmlTagInput.appendChild(inputForm);
        container.prepend(htmlTagInput);

        const link = clockifyButton.createButton(cardId + desc, projectElem);
        htmlTag.appendChild(link);
        container.prepend(htmlTag);
    });

    /* Checklist buttons */
    clockifyButton.render('.checklist-item-details:not(.clockify)', {observe: true}, (elem) => {
        const root = $('div[id="trello-root"]');
        const project= $('.board-header-btn > span').textContent.trim();
        const desc = $('div[class="window-title"] > h2', root).textContent;
        const task = $('.checklist-item-details-text', elem).textContent;

        const link = clockifyButton.createButton({
            description: cardId + task + " - " + desc,
            projectName: project,
            small: true
        });
        link.classList.add('checklist-item-button');
        link.style.position = 'absolute';
        link.style.paddingTop = 0;
        link.style.paddingRight = 0;
        link.style.right = '81px';
        link.style.top = '8px';
        elem.appendChild(link);
    });
}, 1000);
