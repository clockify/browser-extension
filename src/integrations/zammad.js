const config = { observe: true, onNavigationRerender: true };

clockifyButton.render('.ticketZoom-controls:not(.clockify)', config, ticketControls => {
	const ticketNumber = () => text('.ticket-number');
	const ticketTitle = () => text('.ticket-title-update');

	const description = () => `#${ticketNumber()} ${ticketTitle()}`;

	const timer = clockifyButton.createTimer({ description });

	timer.style.marginLeft = '10px';
	timer.style.borderRadius = '4px';
	timer.style.padding = '6px 11px 6px 11px';

	!$('[class*="clockify"]', ticketControls) && ticketControls.append(timer);
});

initializeBodyObserver();
applyManualInputStyles();

function initializeBodyObserver() {
	const bodyObserver = new MutationObserver(applyManualInputStyles);

	const observationTarget = document.documentElement;
	const observationConfig = { attributes: true, attributeFilter: ['style'] };

	bodyObserver.observe(observationTarget, observationConfig);
}

function applyManualInputStyles() {
	const isDarkThemeEnabled = document.documentElement.style.colorScheme === 'dark';

	const darkStyles = `
		#clockifyButton {
			background: hsla(0, 0%, 100%, 0.03);
			border: 1px solid hsl(230, 4%, 17%);
			
			span { 
				color: hsl(213, 3%, 60%) !important;
				top: 1px; 
			}
		}
	`;
	const lightStyles = `
		#clockifyButton {
			background: white;
			border: 1px solid rgba(0,0,0,0.1);
			
			span {
				top: 1px;
			}
		}
	`;

	const stylesToApply = isDarkThemeEnabled ? darkStyles : lightStyles;

	applyStyles(stylesToApply, 'clockify-theme-dependent-styles');
}
