// Note card
clockifyButton.render('.gkA7Yd-sKfxWe .IZ65Hb-TBnied:not(.clockify)', { observe: true }, elem => {
	const toolbar = $('.IZ65Hb-INgbqf', elem);
	const description = text(
		'[contenteditable=false].notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.vIzZGf-r4nke-YPqjbf',
		elem
	);

	const button = clockifyButton.createSmallButton(description);
	toolbar.appendChild(button);
});

// Note modal
clockifyButton.render(
	'.VIpgJd-TUo6Hb.XKSfm-L9AdLc.eo9XGd:not(.clockify)',
	{ observe: true, onNavigationRerender: true },
	elem => {
		const pinIcon = $('.IZ65Hb-s2gQvd', elem);
		const description = text(
			'[contenteditable=true].notranslate.IZ65Hb-YPqjbf.fmcmS-x3Eknd.vIzZGf-r4nke-YPqjbf',
			elem
		);

		const button = clockifyButton.createButton({ description });
		button.style.position = 'absolute';
		button.style.top = '20px';
		button.style.right = '55px';

		pinIcon.appendChild(button);
	}
);

// Checklist inside a note card
clockifyButton.render(
	'.bVEB4e-rymPhb-ibnC6b:not(.clockify)',
	{ observe: true, showTimerOnhover: '.bVEB4e-rymPhb-ibnC6b' },
	elem => {
		const itemTextSelector = '.rymPhb-ibnC6b-bVEB4e-ij8cu';
		const button = clockifyButton.createSmallButton(text(itemTextSelector, elem));

		elem.appendChild(button);
	}
);

// Checklist inside a note modal
clockifyButton.render(
	'.MPu53c-bN97Pc-sM5MNb:not(.clockify)',
	{ observe: true, showTimerOnhover: '.MPu53c' },
	elem => {
		const itemTextSelector = '.IZ65Hb-vIzZGf-L9AdLc-haAclf';
		const button = clockifyButton.createSmallButton(text(itemTextSelector, elem));

		button.style.position = 'absolute';
		button.style.right = '34px';
		button.style.top = '9px';

		elem.appendChild(button);
	}
);
