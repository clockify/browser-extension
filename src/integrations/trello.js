setTimeout(() => {
	clockifyButton.render(
		'.window-sidebar:not(.clockify)',
		{ observe: true },
		(elem) => {
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
		'.list-cards .list-card:not(.clockify)',
		{ observe: true },
		(elem) => {
			elem.style.minHeight = '60px';
			elem.style.paddingRight = '15px';
			elem.classList.add('clockify-trello-card');

			// const editIcon = $(
			// 	'.icon-sm.icon-edit.list-card-operation.js-open-quick-card-editor.js-card-menu'
			// );
			// editIcon.style.border = '1px solid red';

			elem.addEventListener('mouseover', () => {
				const isButtonAlreadyAdded = $('.clockifyButton', elem);
				if (isButtonAlreadyAdded) return;

				const root = $('div[id="trello-root"]');

				const description = () => $('.list-card-title', elem).innerText.trim();
				const projectName = $('.board-header h1', root)?.textContent?.trim();

				const link = clockifyButton.createButton({
					description,
					projectName,
					small: true,
				});

				link.style.position = 'absolute';
				link.style.right = '2px';
				link.style.bottom = '8px';
				link.style.zIndex = '9999';
				link.style.display = 'flex';
				elem.prepend(link);
			});
		}
	);

	/* Checklist buttons */
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
}, 1000);
