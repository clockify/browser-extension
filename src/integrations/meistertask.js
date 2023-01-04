/*jslint indent: 2 */
/*global $: false, document: false, clockifyButton: false*/
clockifyButton.render(
	'.js-box-wrapper:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link, description, clockifyButtonElement, project, tagFunc;

		clockifyButtonElement = $(
			'.js-task-header>div>row>cell:nth-child(5)',
			elem
		);
		description = $(
			'.js-box-wrapper .container-name .js-task-name>div',
			elem
		).textContent;
		project = $('.js-box-wrapper div[title="Project"]>a', elem).textContent;

		tagFunc = function () {
			var index,
				tags = [],
				tagList = $('.js-box-wrapper .ui-tag', elem),
				tagItems;

			if (!tagList) {
				return [];
			}

			tagItems = tagList.children;

			for (index in tagItems) {
				if (tagItems.hasOwnProperty(index)) {
					tags.push(tagItems[index].textContent);
				}
			}
			return tags;
		};

		link = clockifyButton.createSmallButton(description);
		link.style.paddingTop = '5px';

		clockifyButtonElement.parentNode.insertBefore(link, clockifyButtonElement);
	}
);

// new interface

clockifyButton.render(
	'.knightrider-lazyscrollview-item:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			titleElem = $('.kr-text', elem);
		link = clockifyButton.createSmallButton(titleElem.textContent);
		elem.parentNode.appendChild(link);

		link.style.position = 'relative';
		link.style.left = '1rem';
		link.style.top = '0px';
	}
);
