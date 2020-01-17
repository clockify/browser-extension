clockifyButton.render('.b-topic__sidebar_head span.ticket_clock:not(.clockify)', { observe: true }, function (
  elem
) {
  const fn = function () {
    return $('#extension_data').dataset.description;
  };

  const link = clockifyButton.createButton(
    fn,
    $('#extension_data').dataset.project
  );

  elem.appendChild(link, elem);
});
