import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userSlice, UserState } from './slices/userSlice';
import { workspaceSlice, WorkspaceState } from './slices/workspaceSlice';
import { bootSlice, BootState } from './slices/bootSlice';
import { uiSlice, UIState } from './slices/uISlice';
import { settingsSlice, SettingsState } from './slices/settingsSlice';
import { darkThemeSlice, DarkThemeState } from './slices/darkThemeSlice';
import { resetAllSlices, ResetState } from './slices/resetSlice';

export type AppState = BootState &
	UserState &
	WorkspaceState &
	UIState &
	SettingsState &
	DarkThemeState &
	ResetState;

export const useAppStore = create<AppState>()(
	persist(
		(...a) => ({
			...userSlice(...a),
			...workspaceSlice(...a),
			...bootSlice(...a),
			...uiSlice(...a),
			...settingsSlice(...a),
			...darkThemeSlice(...a),
			...resetAllSlices(...a),
		}),
		{
			name: 'appStore',
			partialize: (state: AppState) => ({
				userData: state.userData,
				showPostStartPopup: state.showPostStartPopup,
				usersTimerShortcutPreferences: state.usersTimerShortcutPreferences,
				usersDarkThemePreference: state.usersDarkThemePreference,
				contextMenuEnabled: state.contextMenuEnabled,
				appendWebsiteURL: state.appendWebsiteURL,
				usersAutoStartOnBrowserStartPreferences:
					state.usersAutoStartOnBrowserStartPreferences,
				usersAutoStopOnBrowserClosePreferences:
					state.usersAutoStopOnBrowserClosePreferences,
				integrationCreatePTT: state.integrationCreatePTT,
			}),
		}
	)
);
