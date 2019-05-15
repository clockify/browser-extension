clockifyButton.render('.IZ65Hb-TBnied:not(.clockify)', { observe: true }, (elem) => {
    var link,
        toolbar = $('.IZ65Hb-INgbqf', elem),
        description = $('.IZ65Hb-YPqjbf:not(.LwH6nd)', elem).textContent;

    link = clockifyButton.createSmallButton(description);
    link.style.paddingBottom = "0px";
    toolbar.appendChild(link);
});

// Checklist inside a note
clockifyButton.render(
    '.IZ65Hb-TBnied .gkA7Yd-sKfxWe .CmABtb.RNfche:not(.clockify)',
    { observe: true },
    (elem) => {
        var link,
            position = $('.IZ65Hb-MPu53c-haAclf', elem),
            keepTxtModal =  $('div[contenteditable="true"].notranslate.IZ65Hb-YPqjbf.CmABtb-YPqjbf', elem),
            keepTxt =  $('div[contenteditable="false"].notranslate.IZ65Hb-YPqjbf.CmABtb-YPqjbf', elem),
            listItem = $('.LwH6nd.notranslate.IZ65Hb-YPqjbf.CmABtb-YPqjbf', elem),
            description = elem.textContent;

        if(listItem) {
            return;
        }

        if(keepTxt) {
            keepTxt.style.paddingLeft = "79px";
        }

        if(keepTxtModal) {
            keepTxtModal.style.paddingLeft = "79px";
        }

        link = clockifyButton.createSmallButton(description);
        link.style.position = "relative";
        link.style.left = "30px";
        link.style.top = "4px";
        link.style.paddingLeft = "0px";

        position.appendChild(link);
    }
);