import { AppState } from '../store';

export interface UserPreference {
	userId: string;
	enabled: boolean;
}

export const togglePreference = (
	state: AppState,
	preferenceKey: keyof AppState
): Partial<AppState> | void => {
	const userId = state.userData?.id;
	const preferencesArray = state[preferenceKey] as UserPreference[];

	if (!userId) {
		console.error('No userId found in user store.');
		return;
	}

	const existingUser = preferencesArray.find(user => user.userId === userId);

	if (existingUser) {
		const isPreferenceEnabled = !existingUser.enabled;
		const updatedPreferences = preferencesArray.map(user =>
			existingUser.userId === user.userId ? { ...user, enabled: isPreferenceEnabled } : user
		);

		return {
			[preferenceKey]: updatedPreferences,
		};
	} else {
		return {
			[preferenceKey]: [...preferencesArray, { userId, enabled: true }],
		};
	}
};
