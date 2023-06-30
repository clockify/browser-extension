
clockifyButton.render(
    '.gkA7Yd-sKfxWe .IZ65Hb-TBnied:not(.clockify)',
    { observe: true },
    (elem) => {
        var link,
            toolbar = $('.IZ65Hb-INgbqf', elem),
            checkbox = $('.Q0hgme-MPu53c.IZ65Hb-MPu53c.VIpgJd-MPu53c', elem);
            descSmallBtn = () => {
                let description = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.r4nke-YPqjbf:not(.LwH6nd)', elem).textContent;
                if(description.length == 0){
                    if(checkbox) {
                        description = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.CmABtb-YPqjbf:not(.LwH6nd)', elem).textContent;
                    } else {
                        description = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.h1U9Be-YPqjbf:not(.LwH6nd)', elem).textContent;
                    }
                }
                return description;
            }


        if(!checkbox || checkbox) {
            link = clockifyButton.createSmallButton(descSmallBtn);
            link.style.paddingBottom = '0px';
            toolbar.appendChild(link);
        }
    }
);


clockifyButton.render(
    '.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd:not(.clockify)',
    { observe: true },
    (elem) => {
        var link,
            pinIcon = $('.IZ65Hb-s2gQvd', elem),
            checkbox = $('.Q0hgme-MPu53c.IZ65Hb-MPu53c.VIpgJd-MPu53c', elem);
            desc = () => {

                let descr = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.r4nke-YPqjbf:not(.LwH6nd)', elem).textContent;
                if(descr.length == 0){
                    if(checkbox) {
                        descr = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.CmABtb-YPqjbf:not(.LwH6nd)', elem).textContent;
                    } else {
                        descr = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.h1U9Be-YPqjbf:not(.LwH6nd)', elem).textContent;
                    }
                } 
                return descr;

            }

        link = clockifyButton.createButton(desc);
        link.style.position = 'absolute';
        link.style.top = '20px';
        link.style.right = '55px';

        pinIcon.appendChild(link);
    }
);


// Checklist inside a note
clockifyButton.render(
    '.IZ65Hb-TBnied .gkA7Yd-sKfxWe .CmABtb.RNfche:not(.clockify)',
    { observe: true },
    (elem) => {
        var link,
            title = $('.notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.r4nke-YPqjbf', elem);
            position = $('.IZ65Hb-MPu53c-haAclf', elem),
            keepTxtModal = $(
                'div[contenteditable="true"].notranslate.IZ65Hb-YPqjbf.CmABtb-YPqjbf',
                elem
            ),
            keepTxt = $(
                'div[contenteditable="false"].notranslate.IZ65Hb-YPqjbf.CmABtb-YPqjbf',
                elem
            ),
            listItem = $('.LwH6nd.notranslate.IZ65Hb-YPqjbf.CmABtb-YPqjbf', elem),
            description = elem.textContent;


        if (listItem) {
            return;
        }


        if (keepTxt) {
            keepTxt.style.paddingLeft = '79px';
        }


        if (keepTxtModal) {
            keepTxtModal.style.paddingLeft = '79px';
        }


        link = clockifyButton.createSmallButton(description);
        link.style.position = 'relative';
        link.style.left = '30px';
        link.style.top = '6px';
        link.style.paddingLeft = '0px';


        position.appendChild(link);
    }
);

