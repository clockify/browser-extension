import * as React from 'react';
import locales from '../helpers/locales';
import { useAppStore } from '../zustand/store';

interface DarkModeProps {
	changeSaved: Function;
}

export const DarkMode = (props: DarkModeProps) => {
	const { isCurrentUserDarkTheme, toggleDarkTheme } = useAppStore();

	const onToggleTheme = () => {
		toggleDarkTheme();
		props.changeSaved();
	};

	return (
		<div className="dark-mode" onClick={onToggleTheme}>
			<div
				className={`dark-mode__checkbox ${isCurrentUserDarkTheme() ? 'checked' : ''}`}
			>
				<img
					src="./assets/images/checked.png"
					className={
						isCurrentUserDarkTheme()
							? 'dark-mode__checkbox--img'
							: 'dark-mode__checkbox--img_hidden'
					}
				/>
			</div>
			<span className="dark-mode__title">{locales.ENABLE_DARK_MODE}</span>
		</div>
	);
};
