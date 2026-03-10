// Kanban board (both task modal and side task view)
clockifyButton.render(
	`
		[data-testid=LayoutPanelItem--header]:not(.clockify), 
		[data-testid=dialog-container-content] [class*="headerColumnTitle"]:not(.clockify)
	`,
	{ observe: true },
	headerColumn => {
		if ($('.clockifyButton')) return;

		observeSidebarTitle();

		const descriptionLines = () =>
			textList('[data-placeholder="Add a title..."] p', document, false);
		const description = descriptionLines().join('\n') || 'Untitled';
		const projectName = () =>
			text('[class*="boardTitle"] div') || text('[data-testid=board-title__container] span');

		const tagNames = () => textList('[class*="tags-"] [class*="tag-"]');

		const link = clockifyButton.createSmallButton({ description, projectName, tagNames });

		link.classList.add('icon-2wC6a', 'icon_toolbar-3wbJo', 'icon_default-3suvw');
		headerColumn.style.display = 'flex';
		headerColumn.style.justifyContent = 'space-between';

		headerColumn.appendChild(link);
	}
);

function observeSidebarTitle() {
	const titleObserver = new MutationObserver(debounce(clockifyButton.rerenderAllButtons, 500));
	const observationTarget = document.querySelector('[aria-label="Add a title..."]');

	if (observationTarget) {
		const observationConfig = { childList: true, subtree: true };
		titleObserver.observe(observationTarget, observationConfig);
	}
}

function debounce(func, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
}
