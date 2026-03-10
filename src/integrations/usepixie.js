// Tasks list
clockifyButton.render(
	'[data-flout="middle-- end-- nowrap--"]:not(.clockify)',
	{ observe: true },
	async container => {
		await timeout({ milliseconds: 250 });

		const parentElement = container.parentElement.parentElement.parentElement;
		const taskName = text('tbody [data-column-id="name"] > a', parentElement);
		const clientName = text('tbody [data-column-id="client"]', parentElement);
		const description = `${clientName ? clientName + ' - ' : ''}${taskName}`;

		const timer = clockifyButton.createTimer({
			description,
			projectName: clientName,
			taskName,
			small: true,
		});
		timer.style.marginRight = '10px';

		container.prepend(timer);
	}
);

// Task view
clockifyButton.render(
	'#job-details-header [data-flitem="shy-left--"] > div:not(.clockify)',
	{ observe: true },
	async container => {
		await timeout({ milliseconds: 250 });
		if (container.textContent.includes('Reopen task')) return;

		const taskName = () => text('[data-target="job-rename.jobName"]');
		let clientName = text('#client-editor .px-select-placeholder');
		clientName = clientName !== 'No client selected' ? clientName : '';
		const description = () => `${clientName ? clientName + ' - ' : ''}${taskName()}`;

		const timer = clockifyButton.createTimer({
			description,
			projectName: clientName,
			taskName,
			small: true,
		});
		adaptButton(timer);

		container.prepend(timer);
	}
);

// Clients page - opened client
clockifyButton.render(
	'#client-info-container [data-flitem="shy-left--"] > div [data-flitem="shy-left--"]:not(.clockify)',
	{ observe: true },
	async container => {
		await timeout({ milliseconds: 100 });

		const clientName = text('[data-flout="between-- middle--"] h2');

		const timer = clockifyButton.createTimer({
			description: clientName,
			projectName: clientName,
			small: true,
		});
		adaptButton(timer);

		container.insertAdjacentElement('afterend', timer);
	}
);

function adaptButton(button) {
	button.style.border = '1px solid #252525';
	button.style.padding = '7px';
	button.style.marginRight = '10px';
	button.style.borderRadius = '5px';

	applyStyles(`
		.clockifyButton:hover {
			background: #E1E1E1;
		}
	`);
}
