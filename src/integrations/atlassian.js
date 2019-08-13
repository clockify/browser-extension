//Active sprint modal - Jira 2019-07
clockifyButton.render(
    'div[role="dialog"] > div > div > header:not(.clockify)',
    { observe: true },
    (elem) => {
        if (document.getElementById('clockifyButton')) {
            document.getElementById('clockifyButton').remove();
        }
        const root = elem.closest('div[role="dialog"]');
        const page = elem.closest('div[id="page"]');
        const issueNumber = $('a > span > span', elem).textContent;
        const container = $('div > div > div > div > div > div:first-child > div > div:first-child', elem);
        const desc = $('h1', root).textContent;
        const project = $('div[role="presentation"] > button', page).childNodes[1].childNodes[0].textContent;

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);
        link.style.position = "relative";
        link.style.left = "10px";
        link.style.top = "-18px";
        container.appendChild(link);
    }
);


if (document.getElementById('clockifyButton-jiraIntegration')) {
    document.getElementById('clockifyButton-jiraIntegration').classList.remove('clockify');

    if (document.getElementById('clockifyButton')) {
        document.getElementById('clockifyButton').remove();
    }
}
//Issues and filter(browse one issue) - Jira 2019-07
clockifyButton.render(
    'div[id="jira-frontend"] > div > div > div > div:last-child:not(.clockify)',
    { observe: true },
    (elem) => {
        if (!document.getElementById('clockifyButton-jiraIntegration')) {
            elem.setAttribute('id', 'clockifyButton-jiraIntegration');
        }
        const page = elem.closest('div[id="page"]');
        const container =
            $('div > div > div > div > div > div > div[id="jira-issue-header"] ' +
                '> div > div > div > div > div > div:first-child > div > div', elem);
        const issueNumber = $('a > span > span', container).textContent;
        const descElement = $('div[id="jira-issue-header"]', elem).parentNode;
        const desc = $('h1', descElement).textContent;
        const project = $('div[role="presentation"] > button', page).childNodes[1].childNodes[0].textContent;

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);

        link.style.position = "relative";
        link.style.left = "10px";
        link.style.top = "-18px";

        container.appendChild(link);
        container.style.height = '25px';
    }
);

//Issues and filter(browse one issue) - old view
clockifyButton.render(
    'div[id="issue-content"]:not(.clockify)',
    { observe: true },
    (elem) => {
        if (document.getElementById('clockifyButton')) {
            document.getElementById('clockifyButton').remove();
        }
        const page = elem.closest('div[id="page"]');
        const container = $('header > div > header > div > div > ol', elem);
        const issueNumber = $('li:last-child > a', container).textContent;
        const desc = $('h1', elem).textContent;
        const project = $('div[role="presentation"] > button', page).childNodes[1].childNodes[0].textContent;

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);

        link.style.position = "relative";
        link.style.left = "15px";
        link.style.top = "0px";

        container.appendChild(link);
    }
);

if (document.getElementById('jira-issue-header')) {
    document.getElementById('jira-issue-header').classList.remove('clockify');

    if (document.getElementById('clockifySmallButton')) {
        document.getElementById('clockifySmallButton').remove();
    }
}

//Scrum board(backlog) - detail view
clockifyButton.render(
    'div[id="ghx-detail-view"] > div > div:last-child > div > div > div > div[id="jira-issue-header"]:not(.clockify)',
    { observe: true },
    (elem) => {
        const page = elem.closest('div[id="page"]');
        const root = $('div[id="ghx-detail-view"]');
        const container = $('a', elem).parentNode.parentNode;
        const issueNumber = $('a > span > span', container).textContent;
        const desc = $('h1', root).textContent;
        const project = $('div[role="presentation"] > button', page).childNodes[1].childNodes[0].textContent;

        const link = clockifyButton.createSmallButton(issueNumber + ' ' + desc, project);

        link.style.position = "relative";
        link.style.left = "85px";
        link.style.top = "-32px";

        container.appendChild(link);
        container.style.height = '25px';
    }
);
