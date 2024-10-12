import { create } from 'zustand';
import { userSlice } from './slices/userSlice';
import { workspaceSlice } from './slices/workspaceSlice';
import { bootSlice } from './slices/bootSlice';
import { uiSlice } from './slices/uISlice';
import { settingsSlice } from './slices/settingsSlice';
import { persist } from 'zustand/middleware';
import { darkThemeSlice } from '~/zustand/slices/darkThemeSlice';
import { resetAllSlices } from '~/zustand/slices/resetSlice';

export const useAppStore = create(
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
			partialize: (state) => ({
				userData: state.userData,
				showPostStartPopup: state.showPostStartPopup,
				usersTimerShortcutPreferences: state.usersTimerShortcutPreferences,
				usersDarkThemePreference: state.usersDarkThemePreference,
				contextMenuEnabled: state.contextMenuEnabled,
			}),
		}
	)
);
