// Work packages list items
clockifyButton.render(
	'table.work-package-table tbody tr td.id:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			container = elem,
			description = $(
				'span[data-field-name="subject"]',
				elem.parentNode
			).textContent.trim(),
			projectName = $('#projects-menu').title.trim();

		link = clockifyButton.createSmallButton(description);

		container.appendChild(link);
	}
);

// Work packages details view
clockifyButton.render('#wrapper:not(.clockify)', { observe: true }, (elem) => {
	const subject = () => $('.subject', elem)?.textContent.trim();
	const type = () =>
		$('.work-packages--type-selector span', elem)?.textContent.trim();
	const number = () =>
		$('.work-packages--info-row span', elem)?.textContent.trim();
	const projectName = () =>
		$('#projects-menu .op-app-menu--item-title', elem)?.textContent.trim();
	const description = () => `${type()} ${number()}: ${subject()}`;
	const taskName = () => description();
	const record = { description, projectName, taskName };
	console.debug('Clockify Record:', record);
	//   // header
	//   const containerHeader = $(".work-packages--subject-type-row", elem);
	//   const buttonHeader = clockifyButton.createSmallButton(record);
	//   buttonHeader.style.paddingRight = "5px";
	//   containerHeader?.insertBefore(buttonHeader, containerHeader.firstChild);

	//   // group
	//   const containerGroup = $(".attributes-group--header", elem);
	//   const buttonGroup = clockifyButton.createButton(record);
	//   buttonGroup.style.paddingRight = "5px";
	//   buttonGroup.style.paddingBottom = "10px";
	//   containerGroup?.insertBefore(buttonGroup, containerGroup.firstChild);

	// toolbar
	const containerToolbar = $('.wp-show--header-container', elem);
	const buttonToolbar = clockifyButton.createButton(record);
	buttonToolbar.style.paddingBottom = '10px';
	containerToolbar?.append(buttonToolbar);

	//   // clock
	//   const containerClock = $(".time-logging--value", elem);
	//   const buttonClock = clockifyButton.createSmallButton(record);
	//   buttonClock.style.position = "relative";
	//   buttonClock.style.top = "3px";
	//   buttonClock.style.right = "-6px";
	//   containerClock?.append(buttonClock);
});
