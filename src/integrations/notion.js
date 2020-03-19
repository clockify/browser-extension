clockifyButton.render(
  '.notion-page-controls:not(.clockify)',
  { observe: true },
  function (elem) {

    if ($('#clockifyButton')) {
      elem.removeChild($('#clockifyButton'));
    }

    var container = createTag('div', 'button-link notion-tb-wrapper');

    var descriptionElem = () => {
      return document.title;
    };

    var clockifyButtonLoc = $(
      '.notion-page-controls > div'
    );

    var link = clockifyButton.createButton(descriptionElem);
    link.style.cursor = 'pointer';

    container.appendChild(link);
    clockifyButtonLoc.parentNode.insertBefore(container, clockifyButtonLoc);
  }
);

// Popup/dialog view
clockifyButton.render(
  '.notion-peek-renderer:not(.clockify)',
  { observe: true },
  function (elem) {
    function getDescription () {
      const descriptionElem = elem.querySelector('.notion-scroller .notion-selectable div[contenteditable="true"]');
      return descriptionElem ? descriptionElem.textContent.trim() : '';
    }

    const link = clockifyButton.createButton(getDescription);
    link.style.cursor = 'pointer';

    const wrapper = document.createElement('div');
    wrapper.classList.add('clockify-button-notion-wrapper');
    wrapper.appendChild(link);

    const root = elem.querySelector('div:nth-child(2) > div:nth-child(1) > div:nth-child(1) > div:nth-child(3)');
    if (root) {
      root.prepend(wrapper);
    }
  }
);