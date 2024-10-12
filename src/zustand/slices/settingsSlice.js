export const settingsSlice = (set, get) => ({
	usersTimerShortcutPreferences: [],
	toggleTimerShortcut: () =>
		set((state) => {
			const userId = get().userData.id;
			if (!userId) {
				console.error('No userId found in user store.');
				return;
			}

			const existingUser = state.usersTimerShortcutPreferences.find(
				(user) => user.userId === userId
			);

			if (existingUser) {
				const isCurrentUserTimerShortcutEnabled = !existingUser.enabled;
				const updatedTimerShortcutPreferences =
					state.usersTimerShortcutPreferences.map((user) =>
						existingUser.userId === user.userId
							? { ...user, enabled: isCurrentUserTimerShortcutEnabled }
							: user
					);

				return {
					usersTimerShortcutPreferences: updatedTimerShortcutPreferences,
				};
			} else {
				return {
					usersTimerShortcutPreferences: [
						...state.usersTimerShortcutPreferences,
						{ userId, enabled: true },
					],
				};
			}
		}),
	isCurrentUserTimerShortcutEnabled: () => {
		const { userData, usersTimerShortcutPreferences } = get();
		const userPref = usersTimerShortcutPreferences.find(
			(pref) => pref.userId === userData?.id
		);
		return userPref ? userPref.enabled : false;
	},

	showPostStartPopup: true,
	toggleShowPostStartPopup: () =>
		set((state) => ({ showPostStartPopup: !state.showPostStartPopup })),

	contextMenuEnabled: true,
	toggleContextMenu: () =>
		set((state) => ({ contextMenuEnabled: !state.contextMenuEnabled })),
});
