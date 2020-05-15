// sidbar task
clockifyButton.render('.al_container .item-title-group:not(.clockify)', {observe: true}, (elem) => {
    let description = $('h3').textContent.trim();
    let project = $('h4.group-title a').textContent.trim();
    let link = clockifyButton.createButton(description, project);
    elem.parentNode.appendChild(link);
});

// list
clockifyButton.render('.td_content:not(.clockify)', {observe: true}, (elem) => {
    let project = $('.project_name').textContent.trim();
    let description = $('.td_description', elem).textContent.trim();
    let link = clockifyButton.createSmallButton(description, project);
    link.style.paddingTop = "0px";
    elem.parentNode.appendChild(link);
});

// full width view
clockifyButton.render('.body_width .item-title-group:not(.clockify)', {observe: true}, (elem) => {
    let project = $('.project_name').textContent.trim();
    let description = $('h3').textContent.trim();
    let link = clockifyButton.createButton(description, project);
    elem.parentNode.appendChild(link);
});

// kanban
clockifyButton.render('.todo_wrapper a:not(.clockify)', {observe: true}, (elem) => {
    let project = $('.project_name').textContent.trim();
    let description = $('.todo_wrapper .text', elem).textContent.trim();
    let link = clockifyButton.createSmallButton(description, project);
    link.style.position = "relative";
    link.style.top = "-42px";
    link.style.right = "0px";
    elem.parentNode.appendChild(link);
});

//issues
clockifyButton.render('.issue_title:not(.clockify)', {observe: true}, (elem) => {
    let project = $('.project_name').textContent.trim();
    let description = $('.issue_link', elem).textContent.trim();
    let link = clockifyButton.createSmallButton(description, project);
    elem.parentNode.appendChild(link);
});