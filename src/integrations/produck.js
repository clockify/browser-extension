// Issue details view
clockifyButton.render('[data-toggl-issue] [data-toggl-sidebar]:not(.clockify)', {observe: true}, elem => {
  function getAlias() {
    var aliasSelector = $('[data-toggl-issue] [data-toggl-alias]')
    if (!aliasSelector) return 'No Alias'
    return aliasSelector.getAttribute('data-toggl-alias')
  }

  function getTitle() {
    var titleSelector = $('[data-toggl-issue] [data-toggl-title]')
    if (!titleSelector) return 'No Title'
    return titleSelector.getAttribute('data-toggl-title') || 'No Title'
  }

  function getDescription() {
    return getAlias() + ' - ' + getTitle()
  }

  function getProjectName() {
    var projectSelector = $('[data-toggl-issue] [data-toggl-project]')
    if (!projectSelector) return null
    return projectSelector.getAttribute('data-toggl-project')
  }
  var description = getDescription();
  var project = getProjectName();

  var link = clockifyButton.createButton(description, project)
  var li = document.createElement('li')
  li.classList.add('toggl-item')
  li.appendChild(link)
  elem.prepend(li)
})
