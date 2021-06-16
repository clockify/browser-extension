// LEADS
clockifyButton.render('[data-testid="SidebarLeadTitle"]:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = $('.EditFieldstyles__ComponentReadWrapper-lwe1gw-0', elem).textContent;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.marginTop = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});

// DEALS
clockifyButton.render('.actionsContent:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = $('.descriptionHead h1 a', elem).textContent;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.marginTop = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});

// ACTIVITIES
clockifyButton.render('.cui4-modal__wrap .cui4-modal__header:not(.clockify)', {observe: true}, function (elem) {
  setTimeout(function(){ 
    var link, description;
    description = $('.cui4-input__box [data-test="activity-subject"]').value;
    link = clockifyButton.createButton(description);
    link.style.position = "absolute";
    link.style.paddingTop = "0";
    link.style.paddingBottom = "0";
    link.style.marginBottom = "10px";
    link.style.marginTop = "10px";
    link.style.cursor = 'pointer';
    link.style.right = "40px";
    link.style.top = '2px';
    elem.appendChild(link);
  }, 500);
});

// CONTACTS
clockifyButton.render('.detailView .content .spacer:not(.clockify)', {observe: true}, function (elem) {
  var link, description;
  description = document.title.replace('- contact details','');;
  link = clockifyButton.createButton(description);
  link.style.display = "block";
  link.style.paddingTop = "0";
  link.style.paddingBottom = "0";
  link.style.marginBottom = "10px";
  link.style.marginTop = "10px";
  link.style.cursor = 'pointer';
  elem.appendChild(link);
});
