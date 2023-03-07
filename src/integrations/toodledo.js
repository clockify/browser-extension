clockifyButton.render(
	'.row:not(.clockify), .taskRow:not(.clockify)',
	{ observe: true },
	function (elem) {
		if (elem.querySelectorAll('.clockify-button').length) {
			return;
		}

		const newLayout = $('.tc_title', elem);
		const taskElem = newLayout || $('.task', elem);
		const folderElem = $('.col1', elem) || $('.taskCell:not(.tc_title)', elem);
		let folderName = folderElem && folderElem.firstChild.textContent;

		folderName =
			!folderName || folderName === 'No Folder' ? '' : ' - ' + folderName;

		const link = clockifyButton.createSmallButton(
			taskElem.textContent + folderName
		);

		const newElem = document.createElement('div');
		newElem.appendChild(link);
		newElem.setAttribute(
			'style',
			(newLayout ? 'display:inline-block;' : 'float:left;') +
				'width:30px;height:20px;'
		);
		if (!newLayout) {
			link.setAttribute('style', 'top:1px;');
		}

		const landmarkElem =
			$('.subm', elem) ||
			$('.subp', elem) ||
			$('.ax', elem) ||
			$('.cellAction', elem) ||
			$('.cellStarSmall', elem);
		landmarkElem.parentElement.insertBefore(newElem, landmarkElem.nextSibling);
	}
);
