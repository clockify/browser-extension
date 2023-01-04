clockifyButton.render(
	'.item-topbar:not(.clockify)',
	{ observe: true },
	(elem) => {
		let delay = 1000;
		setTimeout(() => {
			let link,
				wrapper,
				description = $('.item-title', elem),
				container = $('.breadcrumb', elem);

			if (description === null || container === null) {
				return;
			}
			link = clockifyButton.createButton(description.textContent.trim());

			wrapper = createTag('div', 'item-via');
			wrapper.appendChild(link);
			container.parentNode.insertBefore(wrapper, container.nextSibling);
		}, delay);
	}
);

clockifyButton.render(
	'.task-detail:not(.clockify)',
	{ observe: true },
	(elem) => {
		let link,
			wrapper,
			description = $('.task-link', elem.parentNode),
			container = $('.edit-task-reference-wrapper', elem);

		if (description === null || container === null) {
			return;
		}

		link = clockifyButton.createButton(description.textContent);

		wrapper = createTag('div', 'task-via');
		wrapper.appendChild(link);
		container.parentNode.insertBefore(wrapper, container.nextSibling);
	}
);

clockifyButton.render(
	'.task-header:not(.clockify)',
	{ observe: true },
	(elem) => {
		let link,
			wrapper,
			container = $('.action-bar ul', elem),
			description = $('.header-title', elem);

		if (description === null || container === null) {
			return;
		}

		link = clockifyButton.createButton(description.textContent.trim());

		link.style.marginLeft = '10px';
		link.style.width = 'max-content';

		wrapper = createTag('li', 'float-left');
		wrapper.appendChild(link);
		container.appendChild(wrapper);
	}
);
