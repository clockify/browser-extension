// Card
clockifyButton.render('.task-container__header:not(.clockify)', {observe: true}, function (elem) {
  setTimeout(() => {
    if ($('.task-container__header > #clockifyButton')) return true; // prevents start timer duplicating
    
    const projectSelector = 'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_folder.ng-star-inserted > span',
        //tagSelector ='.task-container.ng-trigger.ng-trigger-loading div.cu-tags-select__name',
        tagSelector ='div.cu-tags-view__container div.cu-tags-select__name',
        taskSelector = 'cu-task-breadcrumbs > div > a.breadcrumbs__link.breadcrumbs__link_last.breadcrumbs__link_list.ng-star-inserted > span';
      
    let link,
      task = $(projectSelector) ? ($(taskSelector) ? $(taskSelector).textContent : "") : "",
      project = $(projectSelector) ? $(projectSelector).textContent : ($(taskSelector) ? $(taskSelector).textContent : ""),
      tags = $(tagSelector) ? () => [...new Set(Array.from($$(tagSelector)).map(e => e.innerText))] : "";

  
    link = clockifyButton.createButton({
      description: document.title,
      projectName: project,
      tagNames: tags,
      taskName: task
    });

    const inputForm = clockifyButton.createInput({
      description: document.title,
      projectName: project,
      tagNames: tags,
      taskName: task
    });
  
    link.style.display = "inline-flex";
    link.style.paddingLeft = "10px";
    link.style.marginRight = "15px";
    link.style.cursor = 'pointer';
  
    elem.appendChild(link);
    elem.appendChild(inputForm);

  }, 2000);
});

// List

clockifyButton.render('.cu-task-row__container:not(.clockify)', {observe: true}, function (elem) {
  setTimeout(() => {
    const projectSelector = '.nav-category_child-selected a.nav-category__name-text',
        tagSelector ='.cu-tags-select__name',
        taskSelector = '.cu-nav-section_active .cu-nav-section__name-text';
        // descriptionSelector = '[data-test*=task-row__container__]';
    // console.log('aljekha', $(descriptionSelector));
    let link,
      task = $(projectSelector) ? ($(taskSelector) ? $(taskSelector).textContent : "") : "",
      project = $(projectSelector) ? $(projectSelector).textContent : ($(taskSelector) ? $(taskSelector).textContent : ""),
      tags = $(tagSelector, elem) ? () => [...new Set(Array.from($$(tagSelector, elem)).map(e => e.innerText))] : "",
      description = elem.dataset.test && elem.dataset.task ? `${elem.dataset.test.split('__')[2]} | #${elem.dataset.task}` : "";

  
    link = clockifyButton.createButton({
      description,
      projectName: project,
      tagNames: tags,
      taskName: task,
      small: true
    });
  
    link.style.position = "absolute";
    link.style.right = "-15px";
    link.style.top = "8px";
    link.style.cursor = "pointer";
    link.style.zIndex = "99999";
  
    $('[data-test=task-row-main__link]', elem).parentElement.appendChild(link);

  }, 2000);
});