export const workspaceSlice = (set) => ({
	workspaceLockData: {
		workspaceLocked: null,
		workspaceLockedMessage: null,
	},
	setWorkspaceLocked: (workspaceLocked) =>
		set((state) => ({
			workspaceLockData: { ...state.workspaceLockData, workspaceLocked },
		})),
	setWorkspaceLockedMessage: (workspaceLockedMessage) =>
		set((state) => ({
			workspaceLockData: { ...state.workspaceLockData, workspaceLockedMessage },
		})),
});
