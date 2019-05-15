'use strict';

clockifyButton.render('#timeTrackingItem:not(.clockify)', {observe: true}, (elem) => {

    var link,
        description = $('.task-name', elem).textContent,
        clockifyDiv = createTag('div', 'clockify-container'),
        appendTo = $('.cu-task-info_time-tracking');

    link = clockifyButton.createSmallButton(description);
    link.style.position = "relative";
    link.style.top = "0px";
    link.style.left = "15px";
    clockifyDiv.appendChild(link);
    appendTo.parentNode.insertBefore(clockifyDiv, appendTo);
});