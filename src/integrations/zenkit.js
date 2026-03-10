console.log('[Clockify] Zenkit integration injected...');

clockifyButton.render(
	'.zenkit-entry-detail-popup-subheader-wrapper:not(.clockify)',
	{ observe: true },
	headerActions => {
		const description = () => text('.zenkit-details-view__display-string');

		const timer = clockifyButton.createTimer({ description, small: true });

		timer.style.marginRight = '10px';

		const headerActionsRightSide = $('.zenkit-entry-detail-popup-subheader-right');

		headerActions.insertBefore(timer, headerActionsRightSide);
	}
);
