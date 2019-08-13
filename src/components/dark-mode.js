import * as React from "react";
import {LocalStorageService} from "../services/localStorage-service";
import {getLocalStorageEnums} from "../enums/local-storage.enum";
import {HtmlStyleHelper} from "../helpers/html-style-helper";

const localStorageService = new LocalStorageService();
const htmlStyleHelper = new HtmlStyleHelper();

class DarkMode extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            enabled: false
        };
    }

    componentDidMount() {
        this.isDarkModeOn();
    }

    isDarkModeOn() {
        const userId = localStorageService.get('userId');
        const darkModeFromStorageForUser = localStorageService.get('darkMode') &&
        JSON.parse(localStorageService.get('darkMode'))
            .filter(darkMode => darkMode.userId === userId).length > 0 ?
            JSON.parse(localStorageService.get('darkMode'))
                .filter(darkMode => darkMode.userId === userId)[0] : null;

        if (!darkModeFromStorageForUser) {
            return;
        }

        this.setState({
            enabled: darkModeFromStorageForUser.enabled
        });
    }

    toggleDarkMode() {
        const userId = localStorageService.get('userId');
        let darkModeFromStorage = localStorageService.get('darkMode') ?
            JSON.parse(localStorageService.get('darkMode')) : [];
        let isEnabled;
        const darkModeForCurrentUser = darkModeFromStorage.length > 0 &&
            darkModeFromStorage.filter(darkMode => darkMode.userId === userId).length > 0 ?
                darkModeFromStorage.filter(darkMode => darkMode.userId === userId)[0] : null;

        if (!darkModeForCurrentUser) {
            darkModeFromStorage = [
                ...darkModeFromStorage,
                {
                    userId: userId,
                    enabled: true
                }
            ];
            isEnabled = true;
        } else {
            isEnabled = !this.state.enabled;
            darkModeFromStorage = darkModeFromStorage.map(darkMode => {
                if (darkMode.userId === userId) {
                    darkMode.enabled = isEnabled;
                }

                return darkMode;
            });
        }

        localStorageService.set(
            'darkMode',
            JSON.stringify(darkModeFromStorage),
            getLocalStorageEnums().PERMANENT_PREFIX
        );

        htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();
        this.props.changeSaved();

        this.setState({
            enabled: isEnabled
        });
    }

    render() {
        return (
            <div className="dark-mode"
                 onClick={this.toggleDarkMode.bind(this)}>
                <div className={this.state.enabled ?
                    "dark-mode__checkbox checked" : "dark-mode__checkbox"}>
                    <img src="./assets/images/checked.png"
                         className={this.state.enabled ?
                             "dark-mode__checkbox--img" :
                             "dark-mode__checkbox--img_hidden"}/>
                </div>
                <span className="dark-mode__title">Enable dark mode</span>
            </div>
        )
    }
}

export default DarkMode;