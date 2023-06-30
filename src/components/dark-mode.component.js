import * as React from 'react';

import { getLocalStorageEnums } from '../enums/local-storage.enum';
import { HtmlStyleHelper } from '../helpers/html-style-helper';
import locales from '../helpers/locales';

const htmlStyleHelper = new HtmlStyleHelper();

class DarkModeComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			enabled: false,
		};
	}

	componentDidMount() {
		this.isDarkModeOn();
	}

	async isDarkModeOn() {
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

		this.setState({
			enabled: darkModeFromStorageForUser.enabled,
		});
	}

	async toggleDarkMode() {
		const userId = await localStorage.getItem('userId');
		const darkMode = await localStorage.getItem('darkMode');
		let darkModeFromStorage = darkMode ? JSON.parse(darkMode) : [];
		let isEnabled;
		const darkModeForCurrentUser =
			darkModeFromStorage.length > 0 &&
			darkModeFromStorage.filter((darkMode) => darkMode.userId === userId)
				.length > 0
				? darkModeFromStorage.filter(
						(darkMode) => darkMode.userId === userId
				  )[0]
				: null;

		if (!darkModeForCurrentUser) {
			darkModeFromStorage = [
				...darkModeFromStorage,
				{
					userId: userId,
					enabled: true,
				},
			];
			isEnabled = true;
		} else {
			isEnabled = !this.state.enabled;
			darkModeFromStorage = darkModeFromStorage.map((darkMode) => {
				if (darkMode.userId === userId) {
					darkMode.enabled = isEnabled;
				}

				return darkMode;
			});
		}

		localStorage.setItem(
			'darkMode',
			JSON.stringify(darkModeFromStorage),
			getLocalStorageEnums().PERMANENT_PREFIX
		);

		htmlStyleHelper.addOrRemoveDarkModeClassOnBodyElement();
		this.props.changeSaved();

		this.setState({
			enabled: isEnabled,
		});
	}

	render() {
		return (
			<div className="dark-mode" onClick={this.toggleDarkMode.bind(this)}>
				<div
					className={
						this.state.enabled
							? 'dark-mode__checkbox checked'
							: 'dark-mode__checkbox'
					}
				>
					<img
						src="./assets/images/checked.png"
						className={
							this.state.enabled
								? 'dark-mode__checkbox--img'
								: 'dark-mode__checkbox--img_hidden'
						}
					/>
				</div>
				<span className="dark-mode__title">{locales.ENABLE_DARK_MODE}</span>
			</div>
		);
	}
}

export default DarkModeComponent;
