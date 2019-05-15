'use strict';

clockifyButton.render('.pane_header:not(.clockify)', {observe: true}, function (elem) {
    if(elem.classList.contains('web')) {
        var link, titleFunc, description,
            projectName = $('title').textContent,
            divTag = document.createElement("div");

        titleFunc = function () {
            var titleElem = $('.selected .tab_text .title'),
                ticketNum = location.href.match(/tickets\/(\d+)/);

            if (titleElem !== null) {
                description = titleElem.textContent.trim();
            }

            if (ticketNum) {
                description = '#' + ticketNum[1].trim() + " " + description;
            }
            return description;
        };

        link = clockifyButton.createButton(titleFunc);
        link.style.float = 'right';
        link.style.marginRight = '30px';
        link.style.marginTop = '-36px';
        link.style.marginBottom = '-20px';
        divTag.appendChild(link);
        elem.insertBefore(divTag, elem.querySelector('.btn-group'));
    }

});
