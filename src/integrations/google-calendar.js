clockifyButton.render(
	'span[jsslot].kma42e', // both event card & task card
	{ observe: true },
	function (elem) {
		function createClockifyElements() {
			const getDescription = () => {
				const descriptionSelector = $('[role="heading"]', elem);
				if (descriptionSelector) return descriptionSelector.textContent;
				else return '';
			};
			let cardHeader = $('.wv9rPe');
			if (cardHeader) {
				const link = clockifyButton.createButton({
					description: () => getDescription(),
				});
				const clockifyInput = clockifyButton.createInput({
					description: () => getDescription(),
				});
				const clockifyContainer = createTag('div', 'clockify-widget-container');

				clockifyContainer.appendChild(link);
				clockifyContainer.appendChild(clockifyInput);
				cardHeader.appendChild(clockifyContainer);

				link.style.display = 'inline-flex';
				link.style.cursor = 'pointer';

				clockifyContainer.style.display = 'flex';
				clockifyContainer.style.margin = '7px auto';
				clockifyContainer.style.height = '34px';

				const clockifyInputField = $('.clockify-input');
				clockifyInputField.style.display = 'inline-block';
				clockifyInputField.style.width = '130px';
				clockifyInputField.style.marginLeft = '7px';
				clockifyInputField.style.boxShadow = 'none';
				clockifyInputField.style.border = '1px solid #eaecf0';
				clockifyInputField.style.backgroundColor = '#eaecf0';
			}
		}
		if (!$('.clockify-widget-container')) {
			createClockifyElements();
		}
		$$('[role="button"][data-opens-details="true"]').forEach((item) => {
			item.addEventListener('click', (event) => {
				createClockifyElements();
			});
		});
	}
);
