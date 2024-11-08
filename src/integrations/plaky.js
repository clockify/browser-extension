clockifyButton.render(
	'.offcanvas__sticky-header .offcanvas-header:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	async elem => {
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

		elem.after(container);

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

initializeBodyObserver();

async function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(addCustomCSS);

	const observationTarget = await waitForElement('.icon-sun', document.body);
	const observationConfig = { childList: true, attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function addCustomCSS() {
	$('.clockify-custom-css')?.remove();

	const isThemeLight = window.localStorage['theme'].includes('light');

	// const isThemeLight = Boolean($('.icon-sun--on'));
	const style = createTag('style', 'clockify-custom-css');

	style.innerHTML = `
		.clockify-widget-container {
			margin: 10px 0 10px 20px;
			display: flex;
			align-items: center;
		}

		.clockify-input {
			border-color: rgba(121,120,156, 0.3) !important;
			background-color: rgba(121,120,156, 0.3) !important;
		}

		.clockify-button-inactive,  .clockify-input{
			color: ${isThemeLight ? '#444 !important;' : 'rgba(242,242,248,.87) !important;'}
		}

		#clockifyButton {
			margin-right: 15px;
		}
	`;

	document.head.append(style);
}
