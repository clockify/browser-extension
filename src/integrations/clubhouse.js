clockifyButton.render('.story-state:not(.clockify)', {observe: true}, (elem) => {
    var link, wrap = createTag('div'),
        element = elem,
        getDescription,
        getProject;

    elem = elem.parentNode.parentNode.parentNode;

    getDescription = function () {
        return $('h2.story-name', elem).textContent;
    };

    getProject = function () {
        return $('.story-project .value', elem).textContent;
    };

    link = clockifyButton.createButton($('h2.story-name', elem).textContent);

    wrap.className = 'attribute editable-attribute';
    wrap.appendChild(link);

    element.parentNode.insertBefore(wrap, element.nextSibling);
});
