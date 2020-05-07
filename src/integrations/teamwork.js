if (window.location.href.indexOf("/#/tasks/") !== -1) {
  setTimeout(() => {
    clockifyButton.render('.main-header__base:not(.clockify)', {observe: true}, function (elem) {
      var link, description;
      description = document.title;
      project = $(".w-header-titles__project-name a").textContent;
      link = clockifyButton.createButton(description, project);
      link.style.display = "block";
      link.style.paddingTop = "0";
      link.style.paddingBottom = "0";
      link.style.cursor = 'pointer';
      link.style.position = "absolute";
      link.style.top = '12px';
      link.style.left = "150px";
      elem.appendChild(link);
    });
  }, 1500);
}