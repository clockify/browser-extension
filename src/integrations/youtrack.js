/*jslint indent: 2 */
/*global $: false, document: false, clockifyButton: false*/
'use strict';

/* the first selector is required for youtrack-5 and the second for youtrack-6 */
clockifyButton.render('.yt-issue-view__toolbar:not(.clockify)', {observe: true}, function (elem) {
    var link, description,
        numElem = $('.yt-issue-toolbar__edit-section'),
        titleElem = $(".yt-issue-body__summary"),
        projectElem = $('.fsi-properties a[title^="Project"], .fsi-properties .disabled.bold');

    let ticketNum = location.href.split('/');

    description ='#' + ticketNum[ticketNum.length - 1] + " - " + titleElem.textContent;

    link = clockifyButton.createButton(description);
    link.style.marginLeft = '20px';

    numElem.parentNode.insertBefore(link, numElem.nextSibling);
});

// Agile board
clockifyButton.render('.yt-agile-card:not(.clockify)', {observe: true}, function (elem) {
    var link,
        container = $('.yt-agile-card__header', elem),
        projectName = $('.yt-issue-id').textContent.split('-'),
        description = function () {
            var text = $('.yt-agile-card__summary', elem).textContent,
                id = $('.yt-agile-card__id ', elem).textContent;
            return (id ? id + " " : '') + (text ? text.trim() : '');
        };

    if (projectName.length > 1) {
        projectName.pop();
    }

    link = clockifyButton.createSmallButton(description);

    container.appendChild(link);
});
