setTimeout(() => {
    clockifyButton.render('.mw-indicators.mw-body-content:not(.clockify)', {observe: true}, (elem) => {
    const root = $('div[id="content"]');
    const container = elem;
    const htmlTag = createTag('div', 'button-link');
    const projectElem = $('h1[id="firstHeading"]', root).textContent.trim();
    const desc = $('h1[id="firstHeading"]', root).textContent.trim();
  
    const link = clockifyButton.createButton(desc, projectElem);
    htmlTag.appendChild(link);
    container.appendChild(htmlTag);
  });
    
  }, 1000);