/*jslint indent: 2 */
/*global $: false, document: false, clockifyButton: false*/

// Right side panel
clockifyButton.render('.js-right-pane .tb-element-big:not(.clockify)', {observe: true}, (elem) => {
    var link,
        container = $('.tb-element-title', elem),
        projectElem = $('.tb-element-subtitle a', elem),
        titleElem = $('.js-element-title-inner a', container);

        link = clockifyButton.createButton(titleElem.textContent);

        container.appendChild(link);
});


// Modal window
clockifyButton.render('.js-modal-dialog-content:not(.clockify)', {observe: true}, (elem) => {
    var link,
        container = $('.tb-element-title', elem),
        projectElem = $('.tb-element-subtitle a', elem),
        titleElem = $('.js-element-title-inner a', container);

        link = clockifyButton.createButton(titleElem.textContent);

        container.appendChild(link);
});