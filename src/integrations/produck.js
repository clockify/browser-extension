'use strict'

// Issue details view
clockifyButton.render('[data-toggl-issue] [data-toggl-sidebar]:not(.clockify)', {observe: true}, elem => {
  function getAlias() {
    const aliasSelector = $('[data-toggl-issue] [data-toggl-alias]')
    if (!aliasSelector) return 'No Alias'
    return aliasSelector.getAttribute('data-toggl-alias')
  }

  function getTitle() {
    const titleSelector = $('[data-toggl-issue] [data-toggl-title]')
    if (!titleSelector) return 'No Title'
    return titleSelector.getAttribute('data-toggl-title') || 'No Title'
  }

  function getDescription() {
    return getAlias() + ' - ' + getTitle()
  }

  function getProjectName() {
    const projectSelector = $('[data-toggl-issue] [data-toggl-project]')
    if (!projectSelector) return null
    return projectSelector.getAttribute('data-toggl-project')
  }

  const link = clockifyButton.createButton(getDescription, getProjectName())
  const li = document.createElement('li')
  li.classList.add('toggl-item')
  li.appendChild(link)
  elem.prepend(li)
})
