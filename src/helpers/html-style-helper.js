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

	async addOrRemoveDarkModeClassOnBodyElement() {
		const userId = await localStorage.getItem('userId');
		const darkMode = await localStorage.getItem('darkMode');
		const darkModeFromStorageForUser =
			darkMode &&
			JSON.parse(darkMode).filter((darkMode) => darkMode.userId === userId)
				.length > 0
				? JSON.parse(darkMode).filter(
						(darkMode) => darkMode.userId === userId
				  )[0]
				: null;

		if (!darkModeFromStorageForUser) {
			return;
		}

		if (darkModeFromStorageForUser.enabled) {
			this.addDarkModeClassOnBodyElement();
		} else {
			this.removeDarkModeClassFromBodyElement();
		}
	}

	addDarkModeClassOnBodyElement() {
		const body = document.getElementsByTagName('body')[0];
		body.classList.add('clockify-dark-mode');
	}

	removeDarkModeClassFromBodyElement() {
		const body = document.getElementsByTagName('body')[0];
		body.classList.remove('clockify-dark-mode');
	}

	scrollToTop() {
		window.scrollTo(0, 0);
	}
}
