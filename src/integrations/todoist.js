function getProjectNameFromLabel(elem) {
  var projectLabel = '',
      projectLabelEle = $('.project_item__name', elem.parentNode.parentNode);
  if (projectLabelEle) {
    projectLabel = projectLabelEle.textContent.trim();
  }
  return projectLabel;
}

var levelPattern = /(?:^|\s)indent_([0-9]*?)(?:\s|$)/;
function getParentEle(sidebarCurrentEle) {
  var curLevel, parentClass, parentCandidate;
  curLevel = sidebarCurrentEle.className.match(levelPattern)[1];
  parentClass = 'indent_' + (curLevel - 1);

  parentCandidate = sidebarCurrentEle;
  while (parentCandidate.previousElementSibling) {
    parentCandidate = parentCandidate.previousElementSibling;
    if (parentCandidate.classList.contains(parentClass)) {
      break;
    }
  }
  return parentCandidate;
}

function isTopLevelProject(sidebarCurrentEle) {
  return sidebarCurrentEle.classList.contains('indent_1');
}

function getProjectNameHierarchy(sidebarCurrentEle) {
  var parentProjectEle, projectName;
  projectName = $('.name', sidebarCurrentEle).firstChild.textContent.trim();
  if (isTopLevelProject(sidebarCurrentEle)) {
    return [projectName];
  }
  parentProjectEle = getParentEle(sidebarCurrentEle);
  return [projectName].concat(getProjectNameHierarchy(parentProjectEle));
}

function projectWasJustCreated(projectId) {
  return projectId.startsWith('_');
}

function getSidebarCurrentEle(elem) {
  var editorInstance,
      projectId,
      sidebarRoot,
      sidebarColorEle,
      sidebarCurrentEle;
  editorInstance = elem.closest('.project_editor_instance');
  if (editorInstance) {
    projectId = editorInstance.getAttribute('data-project-id');
    sidebarRoot = $('#project_list');
    if (projectWasJustCreated(projectId)) {
      sidebarCurrentEle = $('.current', sidebarRoot);
    } else {
      sidebarColorEle = $('#project_color_' + projectId, sidebarRoot);
      if (sidebarColorEle) {
        sidebarCurrentEle = sidebarColorEle.closest('.menu_clickable');
      }
    }
  }
  return sidebarCurrentEle;
}

function getProjectNames(elem) {
  var projectNames, viewingInbox, sidebarCurrentEle;
  viewingInbox = $('#filter_inbox.current, #filter_team_inbox.current');
  if (viewingInbox) {
    projectNames = ['Inbox'];
  } else {
    sidebarCurrentEle = getSidebarCurrentEle(elem);
    if (sidebarCurrentEle) {
      projectNames = getProjectNameHierarchy(sidebarCurrentEle);
    } else {
      projectNames = [getProjectNameFromLabel(elem)];
    }
  }
  return projectNames;
}

setTimeout(() => {
  clockifyButton.render(
      '.task_item .content:not(.clockify)',
      { observe: true },
      (elem) => {

        let link,
            description,
            container = $('.task_item_details_bottom', elem),
            projectNames = getProjectNames(elem),
            project = projectNames.length > 0 ? projectNames[0] : "";

        description = $('.task_item_content_text', elem).textContent;
        link = clockifyButton.createSmallButton(description, project);
        link.style.paddingTop = "0px";
        link.style.paddingLeft = "0px";

        container.insertBefore(link, container.firstChild);
      }
  );
}, 1000);

// task view
clockifyButton.render('.item_detail:not(.clockify)', { observe: true }, elem => {
  const container = elem.querySelector('.item_actions');

  const descriptionSelector = () =>
    elem.querySelector('.item_overview_content').firstChild.textContent;

  function getParentIfProject (elem) {
    const parent = elem.querySelector('.item_detail_parent_info');
    let project = '';

    if (parent.querySelector('circle, .item_detail_parent_icon__inbox_icon')) {
      project = parent.querySelector('.item_detail_parent_name').textContent;
    }

    return project;
  }
  const project = getParentIfProject(elem);

  const link = clockifyButton.createButton(descriptionSelector, project);

  const wrapper = document.createElement('div');
  wrapper.classList.add('item_action');
  wrapper.style.display = 'flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  wrapper.appendChild(link);

  if (container) {
    container.insertBefore(wrapper, container.firstChild);
  }
});