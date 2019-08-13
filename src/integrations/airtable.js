'use strict';
clockifyButton.render('.flex-auto.flex.border-darken2.animate:not(.clockify)', {observe: true}, function (elem) {
    let description = $('h3.recordTitle');
    let link = clockifyButton.createButton(description.textContent);
    link.style.height = "60px";
    elem.parentNode.appendChild(link);
});