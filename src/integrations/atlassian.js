// AUI layout
clockifyButton.render(
    'div[id="issue-content"]:not(.clockify)',
    { observe: true },
    (elem) => {
        if (document.getElementById('clockifyButton')) {
            document.getElementById('clockifyButton').remove();
        }

        const page = elem.closest('div[id="page"]');
        const container = $('div[class="aui-page-header-main"]', elem);
        const targetEl = $('.search-container');
        const issueNumber = $('a[class="issue-link"]', container).textContent;
        const desc = $('h1[id="summary-val"]', elem).textContent;

        // Try to find the project
        let project = $('a[id="project-name-val"]', page);
        if (project) {
            project = project.textContent;
        } else {
            project = '';
        }

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);
        link.style.position = "relative";
        link.style.padding = "6px 10px 7px 20px";
        link.style.marginLeft = "10px";
        link.style.verticalAlign = "top";
        link.style.lineHeight = "30px";

        targetEl.appendChild(link);
    }
);

if (document.getElementById('issue-content')) {
    document.getElementById('issue-content').classList.remove('clockify');

    if (document.getElementById('clockifyButton')) {
        document.getElementById('clockifyButton').remove();
    }
}

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
        const container = $('div > div > div > div > div > div:first-child > div > div:first-child > div', elem);
        const issueNumber = $('a > span > span', container.lastChild).textContent;
        const desc = $('h1', root).textContent;

        // Try to find the project
        let project = $('div[role="presentation"] > button', page);
        if (project) {
            project = project.childNodes[1].childNodes[0].textContent;
        } else {
            project = '';
        }

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);
        link.style.position = "relative";
        link.style.padding = "2px 0 0 20px";

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
        const issueNumber = $('a > span > span', container.lastChild).textContent;
        const descElement = $('div[id="jira-issue-header"]', elem).parentNode;
        const desc = $('h1', descElement).textContent;

        // Try to find the project
        let project = $('div[role="presentation"] > button', page);
        if (project) {
            project = project.childNodes[1].childNodes[0].textContent;
        } else {
            project = '';
        }

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);
        link.style.position = "relative";
        link.style.padding = "2px 0 0 20px";
      
        container.appendChild(link);
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
        const container =
            $('div[id="jira-issue-header"] > div > div > div > div > div > div:first-child > div > div', elem);
        const issueNumber = $('a > span > span', container.lastChild).textContent;
        const desc = $('h1', elem).textContent;

        // Try to find the project
        let project = $('div[role="presentation"] > button', page);
        if (project) {
            project = project.childNodes[1].childNodes[0].textContent;
        } else {
            project = '';
        }

        const link = clockifyButton.createButton(issueNumber + ' ' + desc, project);
        link.style.position = "relative";
        link.style.padding = "2px 0 0 20px";

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
        const container =
            $('div[id="jira-issue-header"] > div > div > div > div > div > div:first-child > div > div', elem);
        const issueNumber = $('a > span > span', container.lastChild).textContent;
        const desc = $('h1', root).textContent;

        // Try to find the project
        let project = $('div[role="presentation"] > button', page);
        if (project) {
            project = project.childNodes[1].childNodes[0].textContent;
        } else {
            project = '';
        }

        const link = clockifyButton.createSmallButton(issueNumber + ' ' + desc, project);
        link.style.position = "relative";
        link.style.padding = "0 0 0 20px";

        container.appendChild(link);
    }
);

// Confluence
setTimeout(() => {
clockifyButton.render(
  '#content-header-container:not(.clockify)',
  { observe: true },
  (elem) => {
    let link,
    container = createTag('div', 'button-link notion-tb-wrapper'),
    clockifyButtonLoc = $(
      '[data-test-id="content-buttons"]'
      );
    if (document.getElementById('clockifyButton')) {
        document.getElementById('clockifyButton').remove();
    }
    link = clockifyButton.createButton(document.title);
    link.style.cursor = 'pointer';
    container.appendChild(link);
    clockifyButtonLoc.parentElement.parentNode.firstChild.before(container);
  }
);
}, 1000);