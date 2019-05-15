'use strict';

//Google Calendar Modern
function insertButtonModern(target, description) {
    var link = clockifyButton.createButton(description);
    link.style.marginTop = "-5px";
    target.prepend(link);
}

// Popup view Google Calendar Modern
clockifyButton.render('div[data-chips-dialog="true"]:not(.clockify)', {observe: true}, (elem) => {
    if ($('.clockify-button', elem)) {
        return;
    }
    const target = $('[aria-label]:last-child', elem).parentElement.nextSibling;
    var title = $('span[role="heading"]', elem);
    let description;
    if (title) {
        description = title.textContent;
    }
    insertButtonModern(target, description || "");

});