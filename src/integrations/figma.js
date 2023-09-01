clockifyButton.render(
	'.multiplayer_view--multiplayerView--dkdv7:not(.clockify)',
	{ observe: true },
	(elem) => {
		const description = document.title.replace(' – Figma', '');
		const projectName = text('.filename_view--folderName--Q2b88');

		const link = clockifyButton.createButton({
			description,
			projectName,
			small: true,
		});

		link.style.marginRight = '10px';

		elem.prepend(link);
	}
);
