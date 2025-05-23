import { StateCreator } from 'zustand';
import { AppState } from '../store';

export interface WorkspaceLockData {
	workspaceLocked: boolean | null;
	workspaceLockedMessage: string | null;
}

export interface WorkspaceState {
	workspaceLockData: WorkspaceLockData;
	setWorkspaceLocked: (workspaceLocked: boolean) => void;
	setWorkspaceLockedMessage: (message: string) => void;
}

export const workspaceSlice: StateCreator<AppState, [], [], WorkspaceState> = set => ({
	workspaceLockData: {
		workspaceLocked: null,
		workspaceLockedMessage: null,
	},
	setWorkspaceLocked: workspaceLocked =>
		set(state => ({
			workspaceLockData: { ...state.workspaceLockData, workspaceLocked },
		})),
	setWorkspaceLockedMessage: workspaceLockedMessage =>
		set(state => ({
			workspaceLockData: { ...state.workspaceLockData, workspaceLockedMessage },
		})),
});
