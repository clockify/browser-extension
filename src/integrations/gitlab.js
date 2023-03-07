clockifyButton.render(
	'.issue-details .detail-page-description:not(.clockify)',
	{ observe: true },
	(elem) => {
		const projectLinkElem = $('.breadcrumbs-links li:nth-last-child(3) a'),
			numElem = $('.identifier') || $('.breadcrumbs-links li:last-child a'),
			titleElem = $('.title', elem),
			projectElem =
				$('.title .project-item-select-holder') ||
				$('.breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text'),
			actionsElem = $('.detail-page-header-actions');

		const title = titleElem.textContent.trim();
		const projectRef = projectLinkElem
			? projectLinkElem.href.trim().replace(location.origin + '/', '')
			: '';
		const projectNum = numElem
			? numElem.textContent.split(' ').pop().trim()
			: '';

		const description = (projectRef + projectNum + ' ' + title).trim();
		const projectName = projectElem.textContent.trim();
		const taskName = `${numElem?.textContent?.split(' ')?.pop()} 
		${titleElem.textContent}`.trim();
		const tagNames = () => [
			...new Set(
				Array.from($$('div.labels .gl-label-link')).map((e) => {
					const label = $('.gl-label-text', e).innerText.trim();
					const scopedLabel = $('.gl-label-text-scoped', e)?.innerText?.trim();

					return scopedLabel ? `${label}:${scopedLabel}` : label;
				})
			),
		];

		const buttonProperties = { description, projectName, taskName, tagNames };

		const link = clockifyButton.createButton(buttonProperties);
		const input = clockifyButton.createInput(buttonProperties);

		addCustomCSS();

		actionsElem.parentElement.insertBefore(link, actionsElem);
		actionsElem.parentElement.insertBefore(input, actionsElem);
	}
);

clockifyButton.render(
	'.merge-request-details.issuable-details > .detail-page-description:not(.clockify)',
	{ observe: true },
	(elem) => {
		var link,
			description,
			projectLinkElem = $('.breadcrumbs-links li:nth-last-child(3) a'),
			numElem = $('.identifier') || $('.breadcrumbs-links li:last-child a'),
			titleElem = $('h1.title'),
			projectElem =
				$('.title .project-item-select-holder') ||
				$('.breadcrumbs-list li:nth-last-child(3) .breadcrumb-item-text'),
			actionsElem = $('.detail-page-header-actions');

		var task = titleElem.textContent.trim();

		if (numElem !== null) {
			task =
				'MR' +
				numElem.textContent.split(' ').pop().trim().replace('!', '') +
				'::' +
				task;
		}

		var tags = Array.from($$('div.labels .gl-label-text')).map(
			(e) => e.innerText
		);

		var title = titleElem.textContent.trim();
		var projectRef = projectLinkElem
			? projectLinkElem.href.trim().replace(location.origin + '/', '')
			: '';
		var projectNum = numElem ? numElem.textContent.split(' ').pop().trim() : '';

		description = (projectRef + projectNum + ' ' + title).trim();

		link = clockifyButton.createButton({
			description: description,
			projectName: projectElem.textContent.trim(),
			taskName: task,
			tagNames: tags,
		});
		link.style.marginRight = '15px';
		link.style.padding = '0px';
		link.style.paddingLeft = '20px';
		actionsElem.parentElement.insertBefore(link, actionsElem);

		var inputForm = clockifyButton.createInput({
			description: description,
			projectName: projectElem.textContent.trim(),
			taskName: task,
			tagNames: tags,
		});
		actionsElem.parentElement.insertBefore(inputForm, actionsElem);
	}
);

function addCustomCSS() {
	if ($('.clockify-custom-css')) return;

	const customCSS = `
		#clockifyButton {
			display: flex;
			align-items: flex-start !important;
			margin: 0 7px;
		}

		#clockify-manual-input-form {
			margin-right: 7px;
		}
	`;

	const style = createTag('style', 'clockify-custom-css', customCSS);

	document.head.append(style);
}
