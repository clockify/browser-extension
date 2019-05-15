'use strict';

// Basecamp Next
clockifyButton.render('section.todos li.todo:not(.clockify)', {observe: true}, (elem) => {
    var link, behavior = 'hover_content',
        container = $('.wrapper', elem), spanTag,
        projectFunc;

    if (container === null) {
        return;
    }

    projectFunc = function () {
        var p = $(".project > title") || $(".project > header > h1 > a");
        return p ? p.textContent : "";
    };

    link = clockifyButton.createSmallButton($('.content_for_perma', elem).textContent);

    spanTag = document.createElement("span");
    container.appendChild(spanTag.appendChild(link));
});

// Basecamp Classic
clockifyButton.render('.items_wrapper .item > .content:not(.clockify)', {observe: true}, (elem) => {
    var link, behavior = 'selectable_target', spanTag;

    link = clockifyButton.createButton(elem.querySelector('span.content > span').textContent.trim());
    link.style.marginLeft = '150px';

    link.setAttribute('data-behavior', '');
    link.addEventListener('click', function (e) {
        if (link.getAttribute('data-behavior') === '') {
            link.setAttribute('data-behavior', behavior);
        } else {
            link.setAttribute('data-behavior', '');
        }
    });

    spanTag = document.createElement("span");
    $(".content", elem).appendChild(spanTag.appendChild(link));
});


// Basecamp 3
clockifyButton.render('.todos li.todo:not(.clockify):not(.completed)', {observe: true}, (elem) => {
    var link, project,
        description,
        parent = $('.checkbox__content', elem);


    description = parent.childNodes[1].textContent.trim();
    project = $('#a-breadcrumb-menu-button');
    project = project ? project.textContent : "";

    link = clockifyButton.createSmallButton(description);
    link.style.marginLeft = '150px';

    parent.appendChild(link);
});