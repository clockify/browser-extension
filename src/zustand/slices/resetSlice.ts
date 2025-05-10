import { StateCreator } from 'zustand';
import { AppState } from '../store';

export interface ResetState {
	resetSlices: () => void;
}

export const resetAllSlices: StateCreator<AppState, [], [], ResetState> = (set, get) => ({
	resetSlices: () => {
		get().resetUserSlice();
	},
});
