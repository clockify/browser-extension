clockifyButton.render(
	'.offcanvas > .border-bottom:not(.clockify)',
	{ observe: true },
	async (elem) => {
		await timeout({ milliseconds: 500 });

		$('.clockify-widget-container')?.remove();

		const description = () => text('.offcanvas-header [role="textbox"] span');
		const { projectName, taskName } = getProjectTask();

		const entry = { description, projectName, taskName };

		const link = clockifyButton.createButton(entry);
		const input = clockifyButton.createInput(entry);

		const container = createTag('div', 'clockify-widget-container');

		container.append(link);
		container.append(input);

		elem.before(container);

		addCustomCSS();
	}
);

function getProjectTask() {
	const cardName = text('.offcanvas-header [role="textbox"] span');

	const boardName =
		text('.main-wrapper > .sticky-header div[role=textbox]') ||
		text('#sidebar-main-wrapper .navigation-item a.active div > span') ||
		document.title.replace(` - ${cardName}`, '');

	const [projectName, taskName] = boardName?.split(':');

	return { projectName, taskName };
}

function addCustomCSS() {
	if ($('.clockify-custom-css')) return;

	const style = createTag('style', 'clockify-custom-css');

	style.innerHTML = `
		.clockify-widget-container {
			margin: 10px 0 10px 20px;
			display: flex;
			align-items: center;
		}

		.clockify-input {
			color: rgba(242,242,248, 0.87) !important;
			border-color: rgba(121,120,156, 0.3) !important;
			background-color: rgba(121,120,156, 0.3) !important;
		}

		.clockify-button-inactive {
			color: rgba(242,242,248,.87) !important;
		}

		#clockifyButton {
			margin-right: 15px;
		}
	`;

	document.head.append(style);
}
