clockifyButton.render('#timeTrackingItem:not(.clockify)', {observe: true}, (elem) => {
  var link,
  description = $('.task-name', elem).textContent,
  clockifyDiv = createTag('div', 'clockify-container'),
  appendTo = $('.cu-task-info_time-tracking');

  project = $("div.task-container__header.cu-hidden-print > cu-task-breadcrumbs > div > a:nth-child(4) > span").textContent;
  link = clockifyButton.createSmallButton(description, project);

  link.style.position = "relative";
  link.style.top = "0px";
  link.style.left = "15px";
  clockifyDiv.appendChild(link);
  appendTo.parentNode.insertBefore(clockifyDiv, appendTo);
});