// Inbox timer
clockifyButton.render(
    'div[class="private-flex__child align-center display-flex justify-end UIBox__StyledBox-fTEPdL cTpYtO"]' +
    '> span:not(.clockify)',
    { observe: true },
    (elem) => {
        const root = document.getElementsByClassName('admin-app-container')[0];
        const emailId = '[#' + getEmailId(window.location.href) + ']';
        const expandedEmail =
            $('div[aria-expanded="true"]', root);
        const emailSubject = $('span[class="private-truncated-string__inner p-right-5"]', expandedEmail).textContent;
        let link = clockifyButton.createButton(emailId + ' ' + emailSubject);

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
        const ticketId = '[#' + getTicketId(window.location.href) + ']';
        const ticketSubject = $('h3 > span').textContent;
        let link = clockifyButton.createButton(ticketId + ' ' + ticketSubject);

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
