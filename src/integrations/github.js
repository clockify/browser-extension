clockifyButton.render('#partial-discussion-sidebar:not(.clockify)', {observe: true}, (elem) => {
    var div, link, description,
        numElem = $('.gh-header-number'),
        titleElem = $('.js-issue-title'),
        projectElem = $('h1.public strong a, h1.private strong a'),
        existingTag = $('.discussion-sidebar-item.clockify');

    if (existingTag) {
        if (existingTag.parentNode.firstChild.classList.contains('clockify')) {
            return;
        }
        existingTag.parentNode.removeChild(existingTag);
    }

    description = titleElem.textContent;
    if (numElem !== null) {
        description = numElem.textContent + " " + description.trim();
    }

    div = document.createElement("div");
    div.classList.add("discussion-sidebar-item", "clockify");

    link = clockifyButton.createButton(description, projectElem.textContent);

    div.appendChild(link);
    elem.prepend(div);
});

clockifyButton.render('.project-comment-title-hover:not(.clockify)', {observe: true}, function (elem) {
  var link, itemId, description, project;
  itemId =  $('.js-project-card-details-external-link .text-gray-light', elem).textContent;
  description = $('.js-project-card-details-external-link .js-issue-title', elem).textContent;
  project = $('[data-pjax="#js-repo-pjax-container"]').textContent;
  link = clockifyButton.createSmallButton(itemId + " " + description, project);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});