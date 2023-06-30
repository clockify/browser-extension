const CLOCKIFY_BUTTON_ID = 'clockify-button-card';
const SELECTOR_BUTTON_CONTAINER =
	'.rtb-modal-card-widget-editor__container .rtb-modal-card-widget-editor__toolbar';
const SELECTOR_TITLE = '.card-widget-title-editor__text p';
const SELECTOR_TAGS = '.card-widget-editor-extensions__item--tag';
const MIRO_BUTTON_WRAPPER = 'rtb-modal-card-widget-editor__toolbar-button';
const MIRO_BOARD_NAME = '[data-id="title"] > div > div';

// Add custom css to head
const style = document.createElement('style');
style.innerHTML = `
    .rtb-modal-card-widget-editor__toolbar-button .clockifyButton svg {
        margin-right: 8px;
        margin-left: 12px;
    }
`;
document.head.appendChild(style);

// Trigger renderCardButton() when modal is opened
const observer = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.addedNodes.length > 0) {
			mutation.addedNodes.forEach((node) => {
				if (node.classList && node.classList.contains('rtb-modal')) {
					renderCardButton();
				}
			});
		}
	});
});
observer.observe($('#react-modals-container'), {
	childList: true,
});

// Render Card Button (Kanban)
function renderCardButton() {
	const target = $(SELECTOR_BUTTON_CONTAINER);

	if ($(`#${CLOCKIFY_BUTTON_ID}`) || !target) return;

	const wrapper = document.createElement('div');
	wrapper.className = MIRO_BUTTON_WRAPPER;
	wrapper.id = CLOCKIFY_BUTTON_ID;
	target.insertBefore(wrapper, target.firstChild);

	clockifyButton.render(`#${CLOCKIFY_BUTTON_ID}`, {}, (elem) => {
		const description = () => $(SELECTOR_TITLE)?.textContent;
		const projectName = () => $(MIRO_BOARD_NAME)?.textContent;
		const tagNames = () =>
			Array.from($$(SELECTOR_TAGS)).map((tag) => tag.textContent);

		const link = clockifyButton.createButton({
			description,
			projectName,
			tagNames,
		});

		elem.append(link);
	});
}
