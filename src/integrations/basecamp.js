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
        return p ? p.textContent : "aaaaaaa";
    };
    link = clockifyButton.createSmallButton($('.content_for_perma', elem).textContent, projectFunc);

    spanTag = document.createElement("span");
    container.appendChild(spanTag.appendChild(link));
});

// Basecamp Classic
clockifyButton.render('.items_wrapper .item > .content:not(.clockify)', {observe: true}, (elem) => {
    var link, behavior = 'selectable_target', spanTag;

    link = clockifyButton.createButton(
        elem.querySelector('span.content > span').textContent.trim(),
        $('.project') ?
            ($('.project > title') || $('.project > header > h1 > a')).textContent : ''
    );
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
    let link,
        project,
        nav,
        description,
        header,
        article,
        parent = $('.checkbox__content', elem),
        root = $('main[id="main-content"]');
    description = parent.childNodes[1].textContent.trim();
    nav = $('nav > h1 > div', root);
    header = $('header > div > h1', root);
    article = $('article', root).childNodes[5];

    if (nav) {
        project = $('a' , nav.childNodes[3]).textContent;
    } else if (header) {
        project = header.textContent;
    } else if (article) {
        project = $('div > span > a', article).textContent;
    } else {
        project = "";
    }

    link = clockifyButton.createSmallButton(description, project.trim());
    link.style.marginLeft = '150px';
    parent.appendChild(link);
});