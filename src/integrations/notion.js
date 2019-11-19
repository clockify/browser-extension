clockifyButton.render(
  '.notion-overlay-container .notion-peek-renderer .notion-page-controls + .notion-selectable > [contenteditable="true"][placeholder="Untitled"]:not(.clockify)',
  { observe: true },
  (elem) => {
    let link,
    container = createTag('div', 'button-link notion-tb-wrapper'),
    descriptionElem = elem,
    clockifyButtonLoc = $(
      '.notion-overlay-container .notion-topbar-more-button'
      );

    project = $('#notion-app > div > div.notion-cursor-listener > div.notion-frame > div:nth-child(1) > div.notion-topbar > div > div:nth-child(1) > div > div:nth-child(2)').textContent;
    link = clockifyButton.createButton(descriptionElem.textContent.trim(), project);
    link.style.cursor = 'pointer';

    container.appendChild(link);
    clockifyButtonLoc.parentElement.parentNode.firstChild.after(container);
  }
  );


clockifyButton.render(
  '.notion-page-controls:not(.clockify)',
  { observe: true },
  function (elem) {
    container = createTag('div', 'button-link notion-tb-wrapper');

    clockifyButtonLoc = $(
      '.notion-page-controls > div'
      );
    setTimeout(function(){ 
    try {  
      projectP = $("div.notion-topbar > div > div:nth-child(1) > div.notion-selectable > a > div > div > div:nth-child(2)").textContent;
      link = clockifyButton.createButton(document.title, projectP);
    } catch (err) {
      projectM = $("div.notion-topbar > div > div:nth-child(1) > div > div:nth-child(2)").textContent;
      link = clockifyButton.createButton(document.title, projectM);
    }
    link.style.cursor = 'pointer';

    container.appendChild(link);
    clockifyButtonLoc.parentNode.insertBefore(container, clockifyButtonLoc);
  }, 500);
  }
  );