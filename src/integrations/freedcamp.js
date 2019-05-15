'use strict';

clockifyButton.render('.item-title-group:not(.clockify)', {observe: true}, (elem) => {
    let description = $('h3').textContent.trim();
    let link = clockifyButton.createButton(description);
    elem.parentNode.appendChild(link);
});

clockifyButton.render('.td_content:not(.clockify)', {observe: true}, (elem) => {
    let description = $('.td_description', elem).textContent.trim();
    let link = clockifyButton.createSmallButton(description);
    link.style.paddingTop = "0px";
    elem.parentNode.appendChild(link);
});
