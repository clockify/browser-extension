clockifyButton.render(
  '.details__attributes-right:not(.clockify)',
  { observe: true },
  (elem) => {
    var div,
      link,
      description = $('.details__title-name, js--displayEditForm').textContent,
      project = $('.details__attribute-name').textContent;

    link = clockifyButton.createButton(description);

    div = document.createElement('div');
    div.classList.add('details__attribute', 'clockifyContainer');
    div.appendChild(link);
    elem.appendChild(div);
    $(".clockifyContainer").style.height = "37px";
    $(".clockifyContainer").style.marginTop = "3px";
  }
);
