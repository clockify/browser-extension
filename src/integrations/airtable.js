'use strict';
clockifyButton.render('.detailViewWithActivityFeedBase .dialog > .header >' +
    ' .flex-auto:not(.clockify)', {observe: true}, (elem) => {
    let description = $('h3.recordTitle');
    let container = $('.justify-center.relative > .items-center', elem);
    let link = clockifyButton.createButton(description.textContent);
    link.style.height = "60px";
    link.style.marginLeft = "30px";
    container.appendChild(link);
});