/* the first selector is required for youtrack-5 and the second for youtrack-6 */
clockifyButton.render(
  '.fsi-toolbar-content:not(.clockify), .toolbar_fsi:not(.clockify)',
  { observe: true },
  function (elem) {
    let description;
    const numElem = $('a.issueId');
    const titleElem = $('.issue-summary');

    const projectElem = $(
      '.fsi-properties a[title^="Project"], .fsi-properties .disabled.bold'
    );

    description = titleElem.textContent;
    description =
      numElem.firstChild.textContent.trim() + ' ' + description.trim();

    const link = clockifyButton.createButton(description, projectElem.textContent);

    elem.insertBefore(link, titleElem);
  }
);

/* new view for single issues — obligatory since YouTrack 2018.3 */
clockifyButton.render(
  '.yt-issue-body:not(.clockify)',
  { observe: true },
  function (elem) {
    const parent = elem.closest('.yt-issue-view');
    const issueId = parent.querySelector('.js-issue-id').textContent;
    const link = clockifyButton.createButton(issueId + ' ' + $('h1').textContent.trim(), issueId.split('-')[0]);

    elem.insertBefore(link, $('.yt-issue-view__star'));
  }
);

// Agile board
clockifyButton.render('.yt-agile-card:not(.clockify)', { observe: true }, function (
  elem
) {
  const container = $('.yt-agile-card__summary', elem);
  const projectName = $('.yt-issue-id').textContent.split('-');

  const description = function () {
    const text = $('.yt-agile-card__summary', elem).textContent;
    const id = $('.yt-agile-card__id ', elem).textContent;
    return (id ? id + ' ' : '') + (text ? text.trim() : '');
  };

  if (projectName.length > 1) {
    projectName.pop();
  }

  const link = clockifyButton.createButton(description, projectName.join(''));

  container.appendChild(link);
});
