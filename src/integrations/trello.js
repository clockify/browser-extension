clockifyButton.observeDarkMode(() => {
	return document.documentElement.getAttribute('data-color-mode') === 'dark';
});

setTimeout(() => {
	/* Unknown what this view is */
	clockifyButton.render(
		'.window-sidebar:not(.clockify)',
		{ observe: true },
		(elem) => {
			addPopupElementToIngnoredList();

			const root = $('div[id="trello-root"]');
			const container = elem.lastChild.childNodes[1];
			const htmlTag = createTag('div', 'button-link');
			const htmlTagInput = createTag('div', 'button-link input-button-link');

			const description = $(
				'div[class="window-title"] > h2',
				root
			).textContent.trim();
			const projectName = $('.board-header h1', root)?.textContent?.trim();

			const link = clockifyButton.createButton({ description, projectName });
			const input = clockifyButton.createInput({ description, projectName });

			htmlTagInput.append(input);
			container.prepend(htmlTagInput);

			htmlTag.appendChild(link);
			container.prepend(htmlTag);

			htmlTagInput.style.padding = '0px';

			$('.clockify-input').style.width = '100%';
			$('.clockify-input').style.boxShadow = 'none';
			$('.clockify-input').style.border = '1px solid #eaecf0';
			$('.clockify-input').style.backgroundColor = '#eaecf0';
		}
	);

	/* List cards */
	clockifyButton.render(
		'[data-testid="trello-card"]:not(.clockify)',
		{ observe: true },
		(card) => {
			const root = $('div[id="trello-root"]');

			const description = () => text('[data-testid="card-name"]', card);
			const projectName = () => text('.board-header h1', root);

			const entry = { description, projectName, small: true };

			const link = clockifyButton.createButton(entry);

			/* Show button on hover effect */
			applyStyles(`
				[data-testid="trello-card"] .clockifyButton:not(.active) { display: none !important; }
				[data-testid="trello-card"]:hover .clockifyButton { display: flex !important; }
			`);

			card.style.minHeight = '60px';
			card.style.paddingRight = '15px';

			link.style.position = 'absolute';
			link.style.right = '2px';
			link.style.bottom = '8px';
			link.style.zIndex = '9999';
			link.style.display = 'flex';

			card.prepend(link);
		}
	);

	/* Checklist buttons */
	/* This can probably be deleted, it's most likely not working but being kept here for legacy users */
	clockifyButton.render(
		'.checklist-item-details:not(.clockify)',
		{ observe: true },
		(elem) => {
			const root = $('div[id="trello-root"]');
			//const project= $('.board-header-btn > span').textContent.trim();

			const desc = $('div[class="window-title"] > h2', root).textContent;
			const task = $('.checklist-item-details-text', elem).textContent;

			const description = task + ' - ' + desc;
			const projectName = $('.board-header h1', root)?.textContent?.trim();

			const link = clockifyButton.createButton({
				description,
				projectName,
				small: true,
			});

			link.classList.add('checklist-item-button');
			$('.checklist-item-controls', elem).prepend(link);
		}
	);

	/* Modal view */
	clockifyButton.render(
		'[data-testid="card-back-copy-card-button"]:not(.clockify)',
		{ observe: true },
		(elem) => {
			const root = $('div[id="trello-root"]');

			const desc = $('[data-testid="card-back-title-input"]', root)?.textContent;
			const proj = $('[data-testid="board-name-display"]', root)?.textContent;
			console.log('NEW DESC')
			console.log(desc)

			const link = clockifyButton.createButton({
				description: desc || '',
				projectName: proj || '',
				small: false,
			});

			const inputForm = clockifyButton.createInput({
				description: desc || '',
				projectName: proj || '',
			})

			link.style.marginTop = '8px';
			link.style.marginBottom = '8px';
			elem.parentElement.parentElement.prepend(inputForm);
			elem.parentElement.parentElement.prepend(link);
		}
	);
}, 1000);

async function addPopupElementToIngnoredList() {
	/*
	 *	Whenever the user clicks on an element outside the Task modal, Trello app calls click event handler which closes both the Trello task modal and the Clockify integration popup.
	 *
	 *	However, if the element the user clicked on contains a specific selector (eg: .smart-links-hover-preview) then the handler will not be called.
	 *
	 *	This function adds that selector to the integration popup so that users can use the integration popup without closing it.
	 */

	const integrationPopup = await waitForElement('.clockify-integration-popup');

	integrationPopup.classList.add('smart-links-hover-preview');
}

function observeThemeChange() {
	const themeObserver = new MutationObserver(updateColorStyle);

	themeObserver.observe(document.body, { attributes: true });
}

function updateColorStyle() {
	return isThemeDark() ? addDarkThemeStyle() : removeDarkThemeStyle();
}

function isThemeDark() {
	return document.documentElement.getAttribute('data-color-mode') === 'dark';
}

function addDarkThemeStyle() {
	if ($('.clockify-custom-style-dark')) return;

	const darkThemeStyle = `
		.clockify-input {
			background: #333 !important;
			border: #444 !important;
			color: #f4f4f4 !important;
		}

		.clockify-button-inactive {
			color: rgba(255, 255, 255, 0.81) !important;
		}
	`;

	const style = createTag(
		'style',
		'clockify-custom-style-dark',
		darkThemeStyle
	);

	document.head.append(style);
}

function removeDarkThemeStyle() {
	$('.clockify-custom-style-dark')?.remove();
}
