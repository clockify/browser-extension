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

        link = clockifyButton.createButton(descriptionElem.textContent.trim());
        link.style.cursor = 'pointer';

        container.appendChild(link);
        clockifyButtonLoc.parentElement.parentNode.firstChild.after(container);
    }
);