import {LocalStorageService} from "../services/localStorage-service";

const localStorageService = new LocalStorageService();

export class HtmlStyleHelper {

    constructor() {
    }

    fadeBackground() {
        const modalBackground = document.getElementById('modalBackground');
        modalBackground.classList.add('show');
    }

    unfadeBackground() {
        const modalBackground = document.getElementById('modalBackground');
        modalBackground.classList.remove('show');
    }

    enableDisableElements(isEnabled, elementsIds) {
        elementsIds.forEach(elemId => {
            if (isEnabled) {
                document.getElementById(elemId).removeAttribute('disabled');
            } else {
                document.getElementById(elemId).setAttribute('disabled', 'disabled');
            }
        });
    }

    async addOrRemoveDarkModeClassOnBodyElement() {
        const userId = await localStorageService.get('userId');
        const darkMode = await localStorageService.get('darkMode');
        const darkModeFromStorageForUser = darkMode &&
        JSON.parse(darkMode)
            .filter(darkMode => darkMode.userId === userId).length > 0 ?
            JSON.parse(darkMode)
                .filter(darkMode => darkMode.userId === userId)[0] : null;

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
        body.classList.add('dark');
    }

    removeDarkModeClassFromBodyElement() {
        const body = document.getElementsByTagName('body')[0];
        body.classList.remove('dark');
    }

    scrollToTop() {
        window.scrollTo(0,0);
    }
}