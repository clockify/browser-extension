// clockifyButton.render('.flex-auto.flex.border-darken2.animate:not(.clockify)', {observe: true}, function (elem) {
//clockifyButton.render('.px2 > .flex-auto.flex.border-darken2:not(.clockify)', {observe: true}, function (elem) {
clockifyButton.render('.px2 > .flex.border-darken2:not(.clockify)', {observe: true}, function (elem) {

    let description = $('h3.recordTitle');
    let link = clockifyButton.createButton(description.textContent);
    link.style.height = "45px"; // 60
    link.style.marginLeft = '8px';
    //elem.parentNode.appendChild(link);
    elem.appendChild(link);
});