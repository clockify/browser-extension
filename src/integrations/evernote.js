clockifyButton.render(
	'#qa-NOTE_HEADER:not(.clockify)',
	{ observe: true },
	function (elem) {
		if (elem.querySelector('#clockifyButton')) {
			return;
		}

		const projectFunc = function () {
			const projectElem = $('#qa-NOTE_PARENT_NOTEBOOK_BTN');
			return projectElem ? projectElem.textContent : '';
		};

		const descriptionFunc = function () {
			const descriptionElem = $('#qa-COMMON_EDITOR_IFRAME');
			const descriptionText = descriptionElem
				? $('.AZVFJ.s9EjL', descriptionElem?.contentDocument)
				: '';
			return descriptionText ? descriptionText.textContent.trim() : '';
		};

		const link = clockifyButton.createButton({
			projectName: projectFunc,
			description: descriptionFunc,
		});

		link.style.marginRight = '10px';

		elem.querySelector('.O_cOhBpiRJTtr_RB3iHv').prepend(link);
	}
);
