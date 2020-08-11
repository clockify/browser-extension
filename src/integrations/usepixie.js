(function(){

    function ready(callbackFunc) {
        if (document.readyState !== 'loading') {
          callbackFunc();
        } else {
          document.addEventListener('DOMContentLoaded', callbackFunc);
        }
    }
    
    ready(() => {
        clockifyButton.renderTo('#job-details-header .c-toolbar-container:not(.clockify)', (elem) => {
    
            var link,
                container = $('.c-header > .c-header__section:nth-child(3)'),
                plusBtn = $('.c-dropdown-container:nth-child(1)'),
                taskName = $('.c-header__jobtitle').textContent.trim(),
                clientName = $('#client-editor .selectr-selected .selectr-label').textContent.trim();
    
            link = clockifyButton.createButton(
                `${clientName} - ${taskName}`, // description
                clientName, //project
                taskName // task
            );
    
            link.classList.add('c-button','c-button--outline','c-button--neutral','u-mr-small');
            link.dataset.flitem = "shy-left--";
            plusBtn.dataset.flitem = "";
            container.insertBefore(link, plusBtn);
    
        });
    });
    
    // clients
    ready(() => {
        if (!location.pathname.startsWith('/clients/')) return;

        clockifyButton.renderTo('.c-toolbar-container:not(.clockify)', (elem) => {
    
            var link,
                container = $('.c-header > .c-header__section:nth-child(3)'),
                plusBtn = $('.c-dropdown-container:nth-child(1)'),
                clientName = $('.c-header .o-media .o-media__body .c-heading-3').textContent.trim();
    
            link = clockifyButton.createButton(clientName);
    
            link.classList.add('c-button','c-button--outline','c-button--neutral','u-mr-small');
            link.dataset.flitem = "shy-left--";
            plusBtn.dataset.flitem = "";
            container.insertBefore(link, plusBtn);
    
        });
    });

})();
