clockifyButton.render('#TaskContent:not(.clockify)', {observe: true}, function (elem) {
  setTimeout(function(){ 
      var link, description;
      project = $(".w-header-titles__project-name a").textContent;
      description = document.title;
      link = clockifyButton.createButton($("div.w-task-row__name > span").innerText, project);
      link.style.display = "block";
      link.style.paddingTop = "0";
      link.style.paddingBottom = "0";
      link.style.cursor = 'pointer';
      link.style.position = "absolute";
      link.style.top = '12px';
      link.style.left = "150px";
      elem.appendChild(link);
  }, 500);
});