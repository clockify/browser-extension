// Entity Page
clockifyButton.render(
    '.pinned_fields:not(.clockify)',
    { observe: true },
    elem => {

        const description = () => {
            const titleElem = $('.title_input');
            return titleElem ? titleElem.textContent : '';
        };

        const link = clockifyButton.createButton({
            description
        });

        const input = clockifyButton.createInput({
            description
        });

        elem.append(link);
        elem.append(input);
    }
);

// List Page

// Board Page