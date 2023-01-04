clockifyButton.render(
	'.chr-QuickDetailEntityHeader-topContainer:not(.clockify)',
	{ observe: true },
	function (elem) {
		let link = clockifyButton.createButton(() => {
			return document.title;
		});
		elem.insertBefore(link, elem.firstChild);
	}
);

var titleObserver = new MutationObserver(function (mutations) {
	mutations.forEach(function (mutation) {
		let button = document.getElementById('clockifyButton');
		if (clockifyButton.inProgressDescription != document.title && !!button) {
			setButtonProperties(button, document.title, false);
		} else if (!!button) {
			setButtonProperties(button, document.title, true);
		}
	});
});
var documentTitle = document.querySelector('title');
titleObserver.observe(documentTitle, { childList: true });
