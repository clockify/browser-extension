import { StateCreator } from 'zustand';
import { AppState } from '../store';
import { togglePreference, UserPreference } from '../utils/toggleUserPreferences';

export interface SettingsState {
	usersTimerShortcutPreferences: UserPreference[];
	toggleTimerShortcut: () => void;
	isCurrentUserTimerShortcutEnabled: () => boolean;
	showPostStartPopup: boolean;
	toggleShowPostStartPopup: () => void;
	contextMenuEnabled: boolean;
	toggleContextMenu: () => void;
	appendWebsiteURL: boolean;
	toggleAppendWebsiteURL: () => void;
	usersAutoStartOnBrowserStartPreferences: UserPreference[];
	toggleAutoStartOnBrowserStart: () => void;
	autoStartOnBrowserStart: () => boolean;
	usersAutoStopOnBrowserClosePreferences: UserPreference[];
	toggleAutoStopOnBrowserClose: () => void;
	autoStopOnBrowserClose: () => boolean;
	integrationCreatePTT: boolean;
	toggleIntegrationCreatePTT: () => void;
}

export const settingsSlice: StateCreator<AppState, [], [], SettingsState> = (set, get) => ({
	usersTimerShortcutPreferences: [],
	toggleTimerShortcut: () =>
		set(state => togglePreference(state, 'usersTimerShortcutPreferences') || state),
	isCurrentUserTimerShortcutEnabled: () => {
		const { userData, usersTimerShortcutPreferences } = get();
		const userPref = usersTimerShortcutPreferences.find(pref => pref.userId === userData?.id);
		return userPref ? userPref.enabled : false;
	},

	showPostStartPopup: true,
	toggleShowPostStartPopup: () =>
		set(state => ({ showPostStartPopup: !state.showPostStartPopup })),

	contextMenuEnabled: true,
	toggleContextMenu: () => set(state => ({ contextMenuEnabled: !state.contextMenuEnabled })),

	appendWebsiteURL: false,
	toggleAppendWebsiteURL: () => set(state => ({ appendWebsiteURL: !state.appendWebsiteURL })),

	usersAutoStartOnBrowserStartPreferences: [],
	toggleAutoStartOnBrowserStart: () =>
		set(state => togglePreference(state, 'usersAutoStartOnBrowserStartPreferences') || state),
	autoStartOnBrowserStart: () => {
		const { userData, usersAutoStartOnBrowserStartPreferences } = get();
		const userPref = usersAutoStartOnBrowserStartPreferences.find(
			pref => pref.userId === userData?.id
		);
		return userPref ? userPref.enabled : false;
	},

	usersAutoStopOnBrowserClosePreferences: [],
	toggleAutoStopOnBrowserClose: () =>
		set(state => togglePreference(state, 'usersAutoStopOnBrowserClosePreferences') || state),
	autoStopOnBrowserClose: () => {
		const { userData, usersAutoStopOnBrowserClosePreferences } = get();
		const userPref = usersAutoStopOnBrowserClosePreferences.find(
			pref => pref.userId === userData?.id
		);
		return userPref ? userPref.enabled : false;
	},

	integrationCreatePTT: false,
	toggleIntegrationCreatePTT: () =>
		set(state => ({ integrationCreatePTT: !state.integrationCreatePTT })),
});
