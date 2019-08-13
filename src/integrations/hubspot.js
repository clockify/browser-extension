setTimeout(() => {
    // Inbox timer
    clockifyButton.render(
        'div[class="private-flex__child align-center display-flex justify-end UIBox__StyledBox-fTEPdL cTpYtO"]' +
        '> span:not(.clockify)',
        { observe: true },
        (elem) => {
            const root = document.getElementsByClassName('admin-app-container')[0];
            const emailId = '[#' + getEmailId(window.location.href) + ']';
            const expandedEmail = $('div[aria-expanded="true"]', root);
            const page = 'inboxPage';
            const companyName = getCompanyName(root, page);
            const emailAddress = getEmailAddress(root, page);
            const emailSubject = $('span[class="private-truncated-string__inner p-right-5"]', expandedEmail).textContent;

            let description = emailId + ' ';

            if (!!companyName) {
                description = description + companyName + " - ";
            }
            description += emailSubject + ' (' + emailAddress + ')';
            console.log('description', description);

            let link = clockifyButton.createButton(description);

            link.classList.add("uiButton");
            link.classList.add("private-button");
            link.classList.add("private-button--default");
            link.classList.add("private-button--transparent");
            link.classList.add("selenium-test-marker-close-thread-button");
            link.classList.add("ActionButton-izbLQa");
            link.classList.add("epJtCr");
            link.classList.add("private-button--non-link");
            link.style.padding = '22px 0 20px 20px';
            link.style.position = 'relative';
            link.style.top = '-2px';

            elem.insertBefore(link, elem.firstChild);
        }
    );

    // Ticket timer
    clockifyButton.render(
        'section div[class="align-center UIColumn-wrapper"]:not(.clockify)',
        { observe: true },
        (elem) => {
            if (!window.location.href.includes('ticket')) {
                return;
            }

            const root = document.getElementsByClassName('app')[0];
            const ticketId = '[#' + getTicketId(window.location.href) + ']';
            const ticketSubject = $('h3 > span').textContent;
            const page = 'ticketPage';
            const companyName = getCompanyName(root, page);
            const emailAddress = getEmailAddress(root, page);

            let description = ticketId + ' ';

            if (!!companyName) {
                description = description + companyName + " - ";
            }
            description += ticketSubject + ' (' + emailAddress + ')';

            let link = clockifyButton.createButton(description);

            link.classList.add("uiButton");
            link.classList.add("private-button");
            link.classList.add("private-button--default");
            link.classList.add("private-button--transparent");
            link.classList.add("selenium-test-marker-close-thread-button");
            link.classList.add("ActionButton-izbLQa");
            link.classList.add("epJtCr");
            link.classList.add("private-button--non-link");

            link.style.padding = '22px 0 20px 20px';
            link.style.position = 'relative';
            link.style.top = '-10px';

            elem.lastChild.insertBefore(link, elem.lastChild.firstChild);
        }
    );

    function getEmailId(url) {
        const urlParts = url.split('/');
        const emailId = urlParts[urlParts.length-1].split('#')[0];

        return emailId;
    }

    function getTicketId(url) {
        const urlParts = url.split('ticket');
        const ticketId = urlParts[1].split('/')[1];

        return ticketId;
    }

    function getCompanyName(root, page) {
        let companyName;
        if (page === 'inboxPage') {
            const customerElem = $('section[class="text-center customer-data-sidebar--highlight"]', root);
            const companyElem = customerElem ? $('div > i18n-string', customerElem) : null;
            companyName = companyElem ? companyElem.textContent.split('at')[1].trim() : "";
        } else {
            const companyElem = $('div[class="reagan-test-COMPANIES"]', root);
            companyName = companyElem ? $('a[type="button"] > span', companyElem).textContent.trim() : "";
        }

        return companyName;

    }

    function getEmailAddress(root, page) {
        let email;
        if (page === 'inboxPage') {
            const profilePropertiesElem = $('form[data-selenium-test="profile-properties"]', root);
            email = profilePropertiesElem ? profilePropertiesElem.childNodes[2].childNodes[1].textContent : "";
        } else {
            const profilePropertiesElem = $('div[data-selenium-test="contact-association-card"] > div > div', root).childNodes[1];
            email = profilePropertiesElem ? $('div', profilePropertiesElem).childNodes[1].textContent : "";
        }

        return email;
    }
}, 1000);

