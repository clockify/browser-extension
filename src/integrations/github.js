// For the projects detail page
clockifyButton.render(
	'div[data-test-id="side-panel"] aside ul:not(.clockify)',
	{ observe: true, noDebounce: true },
	(elem) => {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (
					mutation.target.attributes['data-test-id']?.value ===
					'side-panel-title'
				) {
					const description =
						mutation.target.querySelector('h2 span').innerText;
					const issueNum = mutation.target.querySelector('a').innerText;

					const link = clockifyButton.createButton(
						`${issueNum} ${description}`
					);
					const li = document.createElement('li');
					li.style.marginLeft = '8px';
					li.style.padding = '6px 8px';
					li.style.listStyle = 'none';
					li.appendChild(link);
					elem.append(li);
				}
			});
		});

		observer.observe(document.querySelector('#__primerPortalRoot__ header'), {
			childList: true,
			subtree: true,
		});
	},
	'div[data-test-id="side-panel"]'
);

// For the issues page
clockifyButton.render(
	'.gh-header-actions:not(.clockify)',
	{ observe: true },
	function (elem) {
		issueId = $('.gh-header-number').innerText;
		description = issueId + ' ' + $('.js-issue-title').innerText;
		project = $('[data-pjax=\'#repo-content-pjax-container\']').innerText;
		(tags = () => Array.from($$('.IssueLabel')).map((e) => e.innerText)),
			(link = clockifyButton.createButton({
				description: description,
				projectName: project,
				taskName: description,
				tagNames: tags,
			}));
		inputForm = clockifyButton.createInput({
			description: description,
			projectName: project,
			taskName: description,
			tagNames: tags,
		});

		link.style.padding = '3px 14px';
		elem.prepend(link);
		elem.prepend(inputForm);
});

// Sidepanel issue details
setTimeout(() => {
	clockifyButton.render('div[data-testid="side-panel-title"]:not(.clockify)', { observe: true }, (elem) => {
		if (elem != null) {
			const description = $('bdi', elem).innerText;
			const issueNum = $('span', elem).innerText;
			const taskName = `${issueNum} ${description}`;

			// Container for clockify elements
			const clockifyContainer = createTag('div', 'clockify-widget-container');
			clockifyContainer.style.display = 'flex';
			clockifyContainer.style.margin = '6px 0px 6px 0px';
			clockifyContainer.style.gap = '8px';

			// Button
			const link = clockifyButton.createButton({
				description: taskName,
				taskName: taskName,
			});
			clockifyContainer.append(link);

			// Input
			const htmlTagInput = createTag('div', 'clockify-input-container');
			const inputForm = clockifyButton.createInput({
				description: taskName,
				taskName: taskName,
			});
			htmlTagInput.append(inputForm);
			clockifyContainer.appendChild(htmlTagInput);

			// Add clockify elements to header
			elem.append(clockifyContainer);
		}
	});
}, 500);
