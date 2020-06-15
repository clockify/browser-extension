// New June 2020
setTimeout(() => {
  clockifyButton.render('.ticket-subject-heading:not(.clockify)', {observe: true}, function (elem) {
    var link, description;
    description = document.title.split(' : ')[0];
    link = clockifyButton.createButton(description);
    link.style.display = "block";
    link.style.paddingTop = "0";
    link.style.paddingBottom = "0";
    link.style.marginBottom = "10px";
    link.style.marginTop = "10px";
    link.style.cursor = 'pointer';
    elem.appendChild(link);
  });
},500);
