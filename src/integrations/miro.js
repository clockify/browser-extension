const CLOCKIFY_BUTTON_ID = 'clockify-button-card';
const SELECTOR_BUTTON_CONTAINER = '.rtb-modal-card-widget-editor__container .rtb-modal-card-widget-editor__toolbar';
const SELECTOR_TITLE = '.card-widget-title-editor__text p';
const SELECTOR_TAGS = '.card-widget-editor-extensions__item--tag';
const MIRO_BUTTON_WRAPPER = 'rtb-modal-card-widget-editor__toolbar-button';

// Add custom css to head
let style = document.createElement('style');
style.innerHTML = `
    .rtb-modal-card-widget-editor__toolbar-button .clockifyButton svg {
        margin-right: 8px;
        margin-left: 12px;
    }
`;
document.head.appendChild(style);

// Trigger renderCardButton() when modal is opened
let observer = new MutationObserver((mutations) => {
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
observer.observe(document.querySelector('#react-modals-container'), { childList: true });

// Render Card Button
function renderCardButton() {
    let target = document.querySelector(SELECTOR_BUTTON_CONTAINER);
    
    if (document.querySelector(`#${CLOCKIFY_BUTTON_ID}`) || !target) { return; }
    
    let wrapper = document.createElement('div');
    wrapper.className = MIRO_BUTTON_WRAPPER;
    wrapper.id = CLOCKIFY_BUTTON_ID;
    target.insertBefore(wrapper, target.firstChild);
    
    clockifyButton.render(`#${CLOCKIFY_BUTTON_ID}`, {}, (elem) => {
        
        let title = document.querySelector(SELECTOR_TITLE).textContent;
        let tagNames = Array.from(document.querySelectorAll(SELECTOR_TAGS)).map(tag => tag.textContent);
        
        let btn = clockifyButton.createButton({
            description: () => title,
            projectName: tagNames.length > 0 ? tagNames[0] : null,
            tags: tagNames.length > 0 ? tagNames : null
        });
        elem.append(btn);
    });
}
        