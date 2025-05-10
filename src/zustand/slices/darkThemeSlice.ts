import { StateCreator } from 'zustand';
import { AppState } from '../store';
import { UserPreference } from '../utils/toggleUserPreferences';

export interface DarkThemeState {
	usersDarkThemePreference: UserPreference[];
	toggleDarkTheme: () => void;
	isCurrentUserDarkTheme: () => boolean;
}

export const addDarkModeClassOnBodyElement = () => {
	document.body.classList.add('clockify-dark-mode');
};

export const removeDarkModeClassFromBodyElement = () => {
	document.body.classList.remove('clockify-dark-mode');
};

const initialState: DarkThemeState = {
	usersDarkThemePreference: [],
	toggleDarkTheme: () => {},
	isCurrentUserDarkTheme: () => false,
};

export const darkThemeSlice: StateCreator<AppState, [], [], DarkThemeState> = (set, get) => ({
	...initialState,
	toggleDarkTheme: () =>
		set(state => {
			const userId = get().userData?.id;

			if (!userId) {
				console.error('No userId found in user store.');
				return state;
			}

			const existingUser = state.usersDarkThemePreference.find(
				user => user.userId === userId
			);
			if (existingUser) {
				const isCurrentUserDarkTheme = !existingUser.enabled;
				const updatedDarkTheme = state.usersDarkThemePreference.map(user =>
					existingUser.userId === user.userId
						? { ...user, enabled: isCurrentUserDarkTheme }
						: user
				);
				isCurrentUserDarkTheme
					? addDarkModeClassOnBodyElement()
					: removeDarkModeClassFromBodyElement();
				return {
					usersDarkThemePreference: updatedDarkTheme,
				};
			} else {
				addDarkModeClassOnBodyElement();
				return {
					usersDarkThemePreference: [
						...state.usersDarkThemePreference,
						{ userId, enabled: true },
					],
				};
			}
		}),
	isCurrentUserDarkTheme: () => {
		const { userData, usersDarkThemePreference } = get();
		const userPref = usersDarkThemePreference.find(pref => pref.userId === userData?.id);
		return userPref ? userPref.enabled : false;
	},
});
