export class HtmlStyleHelper {
	constructor() {}

	fadeBackground() {
		const modalBackground = document.getElementById('modalBackground');
		modalBackground.classList.add('show');
	}

	unfadeBackground() {
		const modalBackground = document.getElementById('modalBackground');
		modalBackground.classList.remove('show');
	}

	enableDisableElements(isEnabled, elementsIds) {
		elementsIds.forEach((elemId) => {
			if (isEnabled) {
				document.getElementById(elemId).removeAttribute('disabled');
			} else {
				document.getElementById(elemId).setAttribute('disabled', 'disabled');
			}
		});
	}

	scrollToTop() {
		window.scrollTo(0, 0);
	}
}
