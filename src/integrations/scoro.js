if ((window.location.href.indexOf("main") !== -1) || (window.location.href.indexOf("tasks") !== -1)) {
    clockifyButton.render('.Tasktd:not(.clockify)', {observe: true}, (elem) => {
        var link, titleElem = $('.eventName', elem), title = $('.bold', titleElem);
        link = clockifyButton.createSmallButton(title.textContent);
        elem.parentNode.appendChild(link);

        link.style.paddingTop = 0;

        if (window.location.href.indexOf("tasks") !== -1) {
            $(".tasksContainer").style.paddingLeft = "8px";
            link.style.paddingLeft = "10px";
        }
    });
}

if (window.location.href.indexOf("tasks/view") !== -1) {
    clockifyButton.render('.buttonbar.compact-button-bar:not(.clockify)', {observe: true}, (elem) => {
        var link, titleElem = $('.ellip');

        link = clockifyButton.createButton(titleElem.textContent);
        link.style.position = "absolute";
        link.style.top = "-15px";
        link.style.left = "-35px";

        $('.buttonbar.compact-button-bar').parentNode.appendChild(link);
    });
}