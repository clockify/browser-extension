clockifyButton.render(
	`.multiplayer_view--multiplayerView--dkdv7:not(.clockify),
	.multiplayer_view--usersContainer--bzaNI:not(.clockify)`,
	{ observe: true },
	(elem) => {
		const description = document.title.replace(' – Figma', '');
		const projectName =
			text('.filename_view--folderName--Q2b88') ||
			text('.filename_view--folderName--ELUh-');

		const entry = { description, projectName, small: true };

		const link = clockifyButton.createButton(entry);

		link.style.marginRight = '10px';
		link.style.zIndex = '999';

		elem.prepend(link);
	}
);
