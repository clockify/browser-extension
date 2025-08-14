
// Entity View
clockifyButton.render('.extension-entity-view-header-spot:not(.clockify)', { observe: true }, elem => {
	const description = () => {
		return  elem ? elem.dataset?.entityTitle : '';
	};

	const timer = clockifyButton.createButton({ description });
	const input = clockifyButton.createInput({ description });

	const container = createContainer(timer, input);
	container.append(timer);
	container.append(input);

	elem.append(container);
});

function createButtonOnView({small, elem}) {
	const description = () => {
		return  elem ? elem.dataset?.entityTitle : '';
	};

	const timer = clockifyButton.createButton({ small, description });

	const container = createContainer(timer);

	preventEventPropagation(container);
	elem.append(container);
}

// List View
clockifyButton.render('.i-role-list-view .extension-entity-card-spot:not(.clockify)', { observe: true }, elem => {
	createButtonOnView({ small: true, elem });
});

// Board View
clockifyButton.render('.i-role-board-view .extension-entity-card-spot:not(.clockify)', { observe: true }, elem => {
	createButtonOnView({ small: false, elem });
});

// Table View
clockifyButton.render('.i-role-table-view .extension-entity-card-spot:not(.clockify)', { observe: true }, elem => {
	createButtonOnView({ small: true, elem });
});

// Timeline and Gantt View
clockifyButton.render('.i-role-timeline-view .extension-entity-card-spot:not(.clockify)', { observe: true }, elem => {
	createButtonOnView({ small: true, elem });
});

// Feed View
clockifyButton.render('.i-role-feed-view .extension-entity-card-spot:not(.clockify)', { observe: true }, elem => {
	createButtonOnView({ small: true, elem });
});

// Calendar View
clockifyButton.render('.i-role-calendar-view .extension-entity-card-spot:not(.clockify)', { observe: true }, elem => {
	createButtonOnView({ small: true, elem });
});

// Common functions
function preventEventPropagation(element) {
	element.addEventListener('click', e => {
		e.stopPropagation();
		e.preventDefault();
	});
}

function setupInputEvents(input) {
	const inputElement = input.querySelector('input');
	if (inputElement) {
		preventEventPropagation(inputElement);
		inputElement.addEventListener('focus', e => {
			e.stopPropagation();
			e.preventDefault();
		});
		inputElement.addEventListener('keydown', e => {
			e.stopPropagation();
		});
	}
}


// Custom styles
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

	#clockify-manual-input-form {
		display: flex;
		align-items: center;
		margin: 0;
		padding: 0;
	}

	#clockify-manual-input-form input {
		background: white !important;
		color: var(--fibery-color-accentTextColor) !important;
		border: 1px solid color-mix(in srgb, var(--fibery-color-accentTextColor) 20%, transparent) !important;
		font-size: 12px;
		position: relative;
		z-index: 2;
		width: 120px !important;
		height: 24px !important;
	}

	#clockify-manual-input-form input::placeholder {
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
