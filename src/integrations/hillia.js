clockifyButton.render(
	'.task-list-item:not(.clockify):not(.flex-grow)',
	{ observe: true },
	function (elem) {
		const projectName = $('h2.montserrat.flex').innerText;
		const taskName =
			elem.parentNode.previousSibling.querySelector('input').value;
		const description = elem.querySelector('input').value;
		const link = clockifyButton.createButton({
			projectName,
			taskName,
			description,
		});
		link.style.width = '120px';
		link.style.margin = '0 10px';

		elem.append(link);
	}
);
