/*jslint indent: 2 */
/*global $: false, document: false, clockifyButton: false, createTag: false*/
'use strict';

clockifyButton.render('#gwt-debug-NoteTitleView-textBox:not(.clockify)', {observe: true}, (elem) => {
    var link,
        descFunc,
        container,
        parent = $('#gwt-debug-NoteAttributesView-root > div > div:nth-child(2)', $('#gwt-debug-NoteAttributesView-root'));


    descFunc = function () {
        var desc = $('#gwt-debug-NoteTitleView-textBox');
        return desc ? desc.value : "";
    };
    link = clockifyButton.createButton(descFunc);

    container = createTag('div', 'clockify-wrapper evernote');
    container.appendChild(link);
    container.style.display = "inline-block";
    container.style.marginTop = "5px";
    container.style.minWidth = "100px";

    parent.insertBefore(container, parent.firstChild);
});

// New UI
clockifyButton.render('.COQHL4z_Ex89cLdhOUVJp:not(.clockify)', { observe: true }, (elem) => {
    var link,
        descFunc,
        container,
        parent = $('.COQHL4z_Ex89cLdhOUVJp');


    descFunc = function () {
        var desc = $('#qa-NOTE_EDITOR_TITLE');
        return desc ? desc.value : "";
    };

    link = clockifyButton.createButton(descFunc);

    container = createTag('div', 'clockify-wrapper evernote');
    container.appendChild(link);
    container.style.paddingBottom = "3px";


    parent.insertBefore(container, parent.firstChild);
});