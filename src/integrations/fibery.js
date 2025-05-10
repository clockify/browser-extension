// Entity Page
clockifyButton.render(
    '.c1rrm0ax.object_editor_header:not(.clockify)',
    { observe: true },
    elem => {

        const container = createTag('div', 'clockify-widget-container');

        const description = () => {
            const titleElem = $('.title_input');
            return titleElem ? titleElem.textContent : '';
        };

        const button = clockifyButton.createButton({ description });

        const input = clockifyButton.createInput({ description });

        container.append(button);
        container.append(input);

        elem.append(container);
    }
);

// Common functions

function preventEventPropagation(element) {
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
    });
}

function setupInputEvents(input) {
    const inputElement = input.querySelector('input');
    if (inputElement) {
        preventEventPropagation(inputElement);
        inputElement.addEventListener('focus', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });
        inputElement.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
    }
}

function insertAfterTitleWrapper(elem, container, titleWrapperSelector) {
    const titleWrapper = elem.querySelector(titleWrapperSelector);
    if (titleWrapper) {
        titleWrapper.parentNode.insertBefore(container, titleWrapper.nextSibling);
    } else {
        elem.prepend(container);
    }
}

// List Page
clockifyButton.render(
    '.lkr9c4x.card_container:not(.clockify)',
    { observe: true },
    elem => {
        const container = createTag('div', 'clockify-widget-container');

        const description = () => {
            const titleElem = elem.querySelector('.tooltip._rwggs7._ha62ha.s1qbmfeo.title');
            return titleElem ? titleElem.textContent : '';
        };

        const button = clockifyButton.createButton({
            small: true,
            description
        });
        const input = clockifyButton.createInput({ description });

        container.append(button);
        container.append(input);

        preventEventPropagation(container);
        setupInputEvents(input);

        insertAfterTitleWrapper(elem, container, '.t9vmudw.title-wrapper');
    }
);

// Board Page
clockifyButton.render(
    '.c1yifu0v.card_container:not(.clockify)',
    { observe: true },
    elem => {

        const container = createTag('div', 'clockify-widget-container');

        const description = () => {
            const cardContainer = elem.closest('.card_container');
            const titleElem = cardContainer?.querySelector('.title');
            return titleElem ? titleElem.textContent : '';
        };

        const button = clockifyButton.createButton({ description });
        const input = clockifyButton.createInput({ description });

        container.append(button);
        container.append(input);

        preventEventPropagation(container);
        setupInputEvents(input);

        insertAfterTitleWrapper(elem, container, '.t1mu84wd.title-wrapper');
    }
);

applyStyles(`
	.clockify-widget-container {
        display: flex;
		align-items: center;
        line-height: 16px;
        gap: 6px;
        position: relative;
        z-index: 1;
        pointer-events: auto;
	}

    .clockify-widget-container * {
        pointer-events: auto;
    }
    
    form {
        display: flex;
        align-items: center;
        margin: 0;
        padding: 0;
    }

    .clockify-input {
        background: white !important;
        color: var(--fibery-color-accentTextColor) !important;
        border: 1px solid color-mix(in srgb, var(--fibery-color-accentTextColor) 20%, transparent) !important;
        font-size: 12px;
        height: 18px;
        position: relative;
        z-index: 2;
    }

    .clockify-input::placeholder {
        color: color-mix(in srgb, var(--fibery-color-accentTextColor) 40%, transparent) !important;
    }

     .clockifyButton > div {
        display: flex !important;
        align-items: center !important;
        position: relative;
        z-index: 2;
    }

    .clockifyButton > div > span {
        margin-left: 5px !important;
    }

    .clockify-button-inactive {
        color: var(--fibery-color-accentTextColor) !important;
        font-size: 12px;
        line-height: 16px;
        align-items: center;
    }

    .clockify-button-active {
        font-size: 12px;
        line-height: 16px;
        align-items: center;
    }
`);