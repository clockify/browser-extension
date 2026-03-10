// Inbox emails
clockifyButton.render(
	'[aria-label="Reading Pane"] [role="heading"]:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	elem => {
		const link = clockifyButton.createButton(elem.textContent);
		link.style.paddingLeft = '5px';

		elem.appendChild(link);
	}
);

// Composing emails
clockifyButton.render(
	'[aria-label="Command toolbar"] .ms-CommandBar-primaryCommand:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	elem => {
		const isComposingEmail = elem.querySelector('button[name="Send"]');

		if (isComposingEmail) {
			const subject = () => document.querySelector('[aria-label="Add a subject"]').value;

			const link = clockifyButton.createButton(subject);
			link.style.paddingLeft = '5px';

			elem.appendChild(link);
		}
	}
);

// Calendar
clockifyButton.render(
	'[data-app-section=ReadingPane] #TopBar:not(.clockify)',
	{ observe: true },
	elem => {
		const description = text('.CWGkB');

		const timer = clockifyButton.createButton({ description });
		const input = clockifyButton.createInput({ description });
		const container = createContainer(timer, input);

		container.style.display = 'flex';
		container.style.gap = '10px';
		container.style.marginBottom = '5px';
		container.style.marginLeft = '20px';
		container.style.marginRight = '20px';

		elem.appendChild(container);
	}
);

initializeBodyObserver();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const lightStyles = `
		span.clockify-button-inactive {
			color: #444444 !important;
		}

		input.clockify-input {
			color: #444444 !important;
			border: none !important;
			background: #fff !important;
			border: 1px solid #dcdcde !important;
		}
	`;
	const darkStyles = `
		.clockify-button-inactive {
			color: #FFFFFF8A !important;
			fill: #FFFFFF8A;
		}

		#clockify-manual-input-form input, .clockify-input.clockify-input-default {
			background-color: #1D272C;
			border-color: #1D272C;
			color: #FFFFFF8A;
		}
	`;

	const htmlTagClassList = [
		...Array.from(document.documentElement.classList),
		...Array.from(document.body.classList),
	];
	const valueWithDark = htmlTagClassList.find(attributeValue => attributeValue.includes('dark'));
	const stylesToApply = !!valueWithDark ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
