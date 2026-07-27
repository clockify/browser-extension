clockifyButton.render(
	'[class*="figjam_right_panel--leftSection--"]:not(.clockify), [class*="properties_panel--left--"]:not(.clockify)',
	{ observe: true },
	elem => {
		const description = document.title.replace(' – Figma', '');
		const projectName = () =>
			text('.filename_view--folderName--Q2b88') ||
			text('.filename_view--folderName--ELUh-') ||
			text('[data-testid=folder-name-link]');
		const taskName = () => text('[data-testid=filename]');

		const entry = { description, projectName, taskName, small: true };

		const link = clockifyButton.createButton(entry);

		link.style.marginRight = '10px';
		link.style.zIndex = '999';

		elem.append(link);
	}
);
