removeAllButtons('.clockify-button-notion-wrapper');

var titleObserver = new MutationObserver(clockifyDebounce(function(mutations) {
  const mutation = mutations[mutations.length - 1];
  const newTitle = mutation.target.textContent;
  if(typeof newTitle !== 'string') return;
  const el = document.querySelector('.notion-peek-renderer') || document.querySelector('.notion-topbar-action-buttons');
  const button = el.querySelector('#clockifyButton');
  if(button) {
    removeAllButtons('.clockify-button-notion-wrapper');
  } 
  if(el) {
    if(!el.classList.contains('clockify')){
      el.classList.add('clockify');
    }
    createButton(el, mutation.target);
  }
}, 250));

function createButton(elem, titleEl) {
  const desc = titleEl.textContent.trim();
  const link = clockifyButton.createButton(desc);
  link.style.cursor = "pointer";
  link.style.fontSize = "12px";
  link.style.marginTop = "4px";

  const wrapper = document.createElement('div');
  wrapper.classList.add('clockify-button-notion-wrapper');
  wrapper.appendChild(link);

  const root = elem.querySelector('.notion-topbar-more-button').parentNode;
  if (root) {
    root.prepend(wrapper);
  }
}
// Button renders in popup/dialog view
clockifyButton.render(
  '.notion-peek-renderer:not(.clockify)',
  { observe: true },
  function (elem) {
    setTimeout(() => {
      const titleEl = elem.querySelector('.notion-scroller .notion-selectable div[contenteditable="true"]');
      if(!titleEl){
        return;
      }
      const desc = titleEl.textContent.trim();
      if(desc){
        createButton(elem, titleEl);
      }
      titleObserver.observe(titleEl, {subtree: true, characterData: true});
    }, 2000);
  }
);
// Button renders in page view
if(!document.querySelector('.notion-peek-renderer')){
  clockifyButton.render(
    '.notion-topbar-action-buttons:not(.clockify)',
    { observe: true },
    function (elem) {
      setTimeout(() => {
        let titleEl = document.querySelector('.notion-page-controls + div > div') || document.querySelector('.notion-scroller .notranslate[contenteditable=true]');
        if(!titleEl){
          return;
        }
        const desc = titleEl && titleEl.textContent.trim();
        if(desc){
          createButton(elem, titleEl);
        }
        // titleObserver.observe(titleEl, {subtree: true, characterData: true});
      }, 2000);
    }
  );
}