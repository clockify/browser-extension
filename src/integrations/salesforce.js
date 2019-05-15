'use strict';

// Updated Listing view
clockifyButton.render('.bMyTask .list tr.dataRow:not(.clockify)', {observe: true}, (elem) => {
    var link, descFunc, projectFunc,
        container = elem.querySelectorAll(".bMyTask .list tr.dataRow .dataCell a")[0];
    if (container === null) {
        return;
    }

    descFunc = function () {
        return container.textContent;
    };

    projectFunc = function () {
        return ($('.accountBlock .mruText') && $('.accountBlock .mruText').textContent) || "";
    };
    link = clockifyButton.createSmallButton(container.textContent);

    container.insertBefore(link, container.firstChild);
});

// Detail view
clockifyButton.render('#bodyCell:not(.clockify)', {observe: true}, (elem) => {
    var link, descFunc, projectFunc, parent,
        container = $('.content', elem);

    if (container === null) {
        return;
    }

    parent = $('.pageType', container);

    if (!parent) {
        return;
    }

        var desc = $('.pageDescription', container);


    projectFunc = function () {
        return ($('.accountBlock .mruText') && $('.accountBlock .mruText').textContent) || "";
    };

    link = clockifyButton.createButton(desc.textContent.trim());

    parent.appendChild(link);
});

// Lightning
clockifyButton.render('.runtime_sales_activitiesTaskCommon.runtime_sales_activitiesTaskRow:not(.clockify)', {observe: true}, (elem) => {
    var link, descFunc, projectFunc;

    descFunc = function () {
        return $(".subject .uiOutputText", elem).textContent;
    };

    projectFunc = function () {
        return $(".runtime_sales_activitiesTaskContentFields ul").lastChild.textContent;
    };

    link = clockifyButton.createSmallButton($(".subject .uiOutputText", elem).textContent);

    $('.left', elem).appendChild(link);

});


clockifyButton.render('.slds-media__body:not(.clockify)', {observe: true}, (elem) => {
    let description = $('.uiOutputText', elem);

    let link = clockifyButton.createButton(description.textContent);
    elem.parentNode.appendChild(link);

});
