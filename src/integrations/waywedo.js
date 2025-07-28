(() => {
	if (/^(www|app|help)\./.test(window.location.hostname)) {
		return;
	}

	const checklistWrapperClass = 'clockify-checklist-wrapper';
	const instanceTitle = '.article>.panel .article-heading';
	const stepContentTitle = '#stepcontent .article-heading';

	//entire checklist
	clockifyButton.render(
		'#maincontent .checklist-buttons>.pull-right',
		{ observe: true },
		elem => {
			// Unable to filter out with :not(.clockify) because full screen mode messes with the DOM
			if (elem.getElementsByClassName(checklistWrapperClass).length) {
				return;
			}
			const description = () => text(instanceTitle);
			const wrapper = document.createElement('div');
			wrapper.classList.add(checklistWrapperClass);

			const link = clockifyButton.createSmallButton(description);

			wrapper.appendChild(link);

			elem.prepend(wrapper);
		}
	);

	//full screen entire checklist
	clockifyButton.render(
		'.fullscreen-open.checklist-open .navbar-fullscreen #navbuttons>div',
		{ observe: true },
		elem => {
			// Unable to filter out with :not(.clockify) because full screen mode messes with the DOM
			if (elem.getElementsByClassName(checklistWrapperClass).length) {
				return;
			}
			const description = () => text(instanceTitle);
			const wrapper = document.createElement('div');
			wrapper.classList.add(checklistWrapperClass);

			const link = clockifyButton.createSmallButton(description);

			wrapper.appendChild(link);

			elem.append(wrapper);
		}
	);

	//step content
	clockifyButton.render(
		'#stepcontent .article-heading+.article-meta:not(.clockify)',
		{ observe: true },
		elem => {
			const description = () => text(stepContentTitle);
			const wrapper = document.createElement('li');

			wrapper.classList.add('clockify-list-item');
			wrapper.style.verticalAlign = 'top';

			const link = clockifyButton.createSmallButton(description);

			wrapper.appendChild(link);

			elem.append(wrapper);
		}
	);

	applyStyles(`
		.clockify-checklist-wrapper {
			display: inline-flex;
			align-items: center;
			vertical-align: middle;
			padding-left:6px;
			padding-right: 6px;
		}
	`);
})();
