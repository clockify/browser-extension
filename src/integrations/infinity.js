'use strict';

clockifyButton.render('.item-sidebar .item-name:not(.clockify)', {observe: false}, function (elem) {

    elem.classList.remove("clockify");

    if (document.getElementById('clockifyButton')) {
        document.getElementById('clockifyButton').remove();
    }

    let description = $('.item-sidebar .item-name');
    let link = clockifyButton.createButton(description.textContent.trim());

    link.style.paddingTop = "0";
    link.style.paddingBottom = "0";

    elem.parentNode.appendChild(link);
});